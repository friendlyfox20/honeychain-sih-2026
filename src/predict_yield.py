import os
import json
import joblib
import pandas as pd
import numpy as np
import argparse

def load_model_and_metadata(model_dir="models"):
    """
    Loads the trained best honey yield model and its metadata.
    """
    model_path = os.path.join(model_dir, "best_honey_yield_model.joblib")
    metadata_path = os.path.join(model_dir, "model_metadata.json")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}. Please run diagnose_and_retrain.py first.")
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Metadata file not found at: {metadata_path}. Please run diagnose_and_retrain.py first.")
        
    model = joblib.load(model_path)
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
        
    return model, metadata

def predict_honey_yield(env_temp, rel_hum, hive_temp, hive_hum, wind_speed, date_str, 
                        csv_path=os.path.join("DAT", "Honey_Production_Dataset_for_2024.csv"),
                        model_dir="models"):
    """
    Predicts honey yield (kg) given environmental and hive parameters.
    Automatically computes non-leaking lag features from historical records up to t-1.
    """
    model, metadata = load_model_and_metadata(model_dir=model_dir)
    feature_cols = metadata.get("feature_columns")
    
    parsed_date = pd.to_datetime(date_str)
    month = parsed_date.month
    day_of_year = parsed_date.dayofyear
    
    # Load dataset to extract historical lags dynamically if present
    lag_1 = None
    roll_mean_3 = None
    roll_mean_7 = None
    roll_std_7 = None
    
    if os.path.exists(csv_path):
        df_hist = pd.read_csv(csv_path)
        df_hist['parsed_date'] = pd.to_datetime(df_hist['Date'], format='%B %d, %Y')
        df_hist = df_hist.sort_values('parsed_date').reset_index(drop=True)
        
        # Check for dates strictly prior to target date
        df_past = df_hist[df_hist['parsed_date'] < parsed_date]
        if len(df_past) >= 7:
            past_weights = df_past['Honey Weight (kg)'].values
            lag_1 = past_weights[-1]
            roll_mean_3 = np.mean(past_weights[-3:])
            roll_mean_7 = np.mean(past_weights[-7:])
            roll_std_7 = np.std(past_weights[-7:], ddof=1) if len(past_weights[-7:]) > 1 else 0.0
            
    # Fallback default values if date is out of range / first day
    if lag_1 is None:
        lag_1 = 20.0
        roll_mean_3 = 20.0
        roll_mean_7 = 20.0
        roll_std_7 = 0.5
        
    input_data = {
        'Environmental Temperature (°C)': [float(env_temp)],
        'Relative Humidity (%)': [float(rel_hum)],
        'Hive Temperature (°C)': [float(hive_temp)],
        'Hive Humidity (%)': [float(hive_hum)],
        'Wind Speed (km/h)': [float(wind_speed)],
        'month': [int(month)],
        'day_of_year': [int(day_of_year)],
        'honey_weight_lag1': [float(lag_1)],
        'honey_weight_roll_mean_3': [float(roll_mean_3)],
        'honey_weight_roll_mean_7': [float(roll_mean_7)],
        'honey_weight_roll_std_7': [float(roll_std_7)]
    }
    
    df_input = pd.DataFrame(input_data)[feature_cols]
    prediction = model.predict(df_input)[0]
    
    return float(prediction), {
        'honey_weight_lag1': lag_1,
        'honey_weight_roll_mean_3': roll_mean_3,
        'honey_weight_roll_mean_7': roll_mean_7,
        'honey_weight_roll_std_7': roll_std_7
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict Honey Yield (kg) using trained model with lag features.")
    parser.add_argument("--env-temp", type=float, default=22.5, help="Environmental Temperature (°C)")
    parser.add_argument("--rel-hum", type=float, default=75.0, help="Relative Humidity (%)")
    parser.add_argument("--hive-temp", type=float, default=33.5, help="Hive Temperature (°C)")
    parser.add_argument("--hive-hum", type=float, default=58.0, help="Hive Humidity (%)")
    parser.add_argument("--wind-speed", type=float, default=4.5, help="Wind Speed (km/h)")
    parser.add_argument("--date", type=str, default="2024-11-15", help="Date (YYYY-MM-DD or Month DD, YYYY)")
    
    args = parser.parse_args()
    
    try:
        pred_yield, lags_used = predict_honey_yield(
            env_temp=args.env_temp,
            rel_hum=args.rel_hum,
            hive_temp=args.hive_temp,
            hive_hum=args.hive_hum,
            wind_speed=args.wind_speed,
            date_str=args.date
        )
        print("\n==========================================")
        print("HONEY YIELD PREDICTION INFERENCE RESULT")
        print("==========================================")
        print(f"Input Parameters:")
        print(f"  Date:                      {args.date}")
        print(f"  Environmental Temperature: {args.env_temp:.2f} °C")
        print(f"  Relative Humidity:         {args.rel_hum:.2f} %")
        print(f"  Hive Temperature:          {args.hive_temp:.2f} °C")
        print(f"  Hive Humidity:             {args.hive_hum:.2f} %")
        print(f"  Wind Speed:                {args.wind_speed:.2f} km/h")
        print(f"Dynamic Lags Inferred from Past History (<= t-1):")
        print(f"  Previous Day Honey Weight: {lags_used['honey_weight_lag1']:.2f} kg")
        print(f"  3-Day Rolling Mean:        {lags_used['honey_weight_roll_mean_3']:.2f} kg")
        print(f"  7-Day Rolling Mean:        {lags_used['honey_weight_roll_mean_7']:.2f} kg")
        print(f"  7-Day Rolling Std:         {lags_used['honey_weight_roll_std_7']:.2f} kg")
        print("------------------------------------------")
        print(f"Predicted Honey Yield:       {pred_yield:.4f} kg")
        print("==========================================\n")
    except Exception as e:
        print(f"Error during prediction: {e}")
