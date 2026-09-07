import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline

def main():
    sns.set_theme(style="whitegrid")
    
    # Separate directories for daily production experiment
    csv_path = os.path.join("DAT", "Honey_Production_Dataset_for_2024.csv")
    models_dir = "models"
    out_dir = os.path.join("results", "daily_production")
    plots_dir = os.path.join(out_dir, "plots")
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)
    
    print("==========================================")
    print("DAILY HONEY PRODUCTION EXPERIMENT")
    print("==========================================")
    
    # 1 & 2. Load and Sort Dataset
    df = pd.read_csv(csv_path)
    df['parsed_date'] = pd.to_datetime(df['Date'], format='%B %d, %Y')
    df = df.sort_values('parsed_date').reset_index(drop=True)
    
    # 3. Create Target: daily_honey_production = Honey Weight(t) - Honey Weight(t-1)
    df['daily_honey_production'] = df['Honey Weight (kg)'].diff()
    
    # 4. Target Analysis (All Days)
    all_daily_prod = df['daily_honey_production'].dropna()
    print("\n--- ALL DAYS DAILY PRODUCTION STATS (364 DAYS) ---")
    print(f"Min:                {all_daily_prod.min():.4f} kg")
    print(f"Max:                {all_daily_prod.max():.4f} kg")
    print(f"Mean:               {all_daily_prod.mean():.4f} kg")
    print(f"Median:             {all_daily_prod.median():.4f} kg")
    print(f"Std Dev:            {all_daily_prod.std():.4f} kg")
    print(f"Negative Values:    {(all_daily_prod < 0).sum()}")
    
    # Identify extraction dates
    extraction_df = df[df['Extract Honey'] == True]
    print("\n--- EXTRACTION EVENTS (HARVEST DATES) ---")
    for idx, row in extraction_df.iterrows():
        print(f"  Date: {row['parsed_date'].strftime('%Y-%m-%d')} ({row['Date']}) | Pre-harvest Weight: {row['Honey Weight (kg)']} kg | Recorded Delta: {row['daily_honey_production']:.2f} kg")
        
    print("\n[Explanation of Negative Production Drops]:")
    print("The 3 negative values occur exclusively on April 30 (-29.25 kg), August 31 (-61.92 kg), and December 31 (-12.80 kg).")
    print("These correspond to human harvesting events where accumulated honey frames were removed from the hive down to a 5.0 kg baseline.")
    print("They represent human operational removal, NOT negative biological production or honey consumption by bees.")

    # 5. Handle Extraction Dates Separately for Modeling
    # Non-extraction days statistics
    non_ext_df = df[df['Extract Honey'] == False].dropna(subset=['daily_honey_production'])
    print("\n--- NON-EXTRACTION DAYS STATS (361 DAYS) ---")
    print(f"Min:     {non_ext_df['daily_honey_production'].min():.4f} kg")
    print(f"Max:     {non_ext_df['daily_honey_production'].max():.4f} kg")
    print(f"Mean:    {non_ext_df['daily_honey_production'].mean():.4f} kg")
    print(f"Median:  {non_ext_df['daily_honey_production'].median():.4f} kg")
    print(f"Std Dev: {non_ext_df['daily_honey_production'].std():.4f} kg")
    print(f"Negatives: {(non_ext_df['daily_honey_production'] < 0).sum()}")

    # 6. Create Causal Features (Strictly <= t-1)
    df['month'] = df['parsed_date'].dt.month
    df['day_of_year'] = df['parsed_date'].dt.dayofyear
    
    df['prev_daily_production'] = df['daily_honey_production'].shift(1)
    df['lag1_honey_weight'] = df['Honey Weight (kg)'].shift(1)
    df['lag2_daily_production'] = df['daily_honey_production'].shift(2)
    df['lag3_daily_production'] = df['daily_honey_production'].shift(3)
    
    df['roll_mean_3_prod'] = df['daily_honey_production'].shift(1).rolling(3).mean()
    df['roll_mean_7_prod'] = df['daily_honey_production'].shift(1).rolling(7).mean()
    df['roll_std_7_prod'] = df['daily_honey_production'].shift(1).rolling(7).std()
    
    feature_cols = [
        'prev_daily_production',
        'lag1_honey_weight',
        'lag2_daily_production',
        'lag3_daily_production',
        'roll_mean_3_prod',
        'roll_mean_7_prod',
        'roll_std_7_prod',
        'Environmental Temperature (°C)',
        'Relative Humidity (%)',
        'Hive Temperature (°C)',
        'Hive Humidity (%)',
        'Wind Speed (km/h)',
        'month',
        'day_of_year'
    ]
    target_col = 'daily_honey_production'
    
    # Filter out extraction days and drop initial warmup rows with NaN features
    df_model = df[df['Extract Honey'] == False].copy()
    df_clean = df_model.dropna(subset=feature_cols + [target_col]).reset_index(drop=True)
    
    # 8. Chronological Train/Test Split (80% Train, 20% Test)
    n_samples = len(df_clean)
    n_train = int(np.floor(0.8 * n_samples))
    
    train_clean = df_clean.iloc[:n_train].copy()
    test_clean = df_clean.iloc[n_train:].copy()
    
    X_train = train_clean[feature_cols]
    y_train = train_clean[target_col]
    X_test = test_clean[feature_cols]
    y_test = test_clean[target_col]
    dates_test = test_clean['parsed_date']
    
    train_start_str = train_clean['parsed_date'].iloc[0].strftime('%Y-%m-%d')
    train_end_str = train_clean['parsed_date'].iloc[-1].strftime('%Y-%m-%d')
    test_start_str = test_clean['parsed_date'].iloc[0].strftime('%Y-%m-%d')
    test_end_str = test_clean['parsed_date'].iloc[-1].strftime('%Y-%m-%d')
    
    print("\n--- CHRONOLOGICAL DATASET SPLIT ---")
    print(f"Training Set ({len(train_clean)} rows): {train_start_str} to {train_end_str}")
    print(f"Test Set ({len(test_clean)} rows):     {test_start_str} to {test_end_str}")
    
    # 9. Model Training & Comparison
    tscv = TimeSeriesSplit(n_splits=5)
    
    # Baselines
    # Persistence baseline (predict prev_daily_production)
    y_pred_pers = test_clean['prev_daily_production'].values
    mae_pers = mean_absolute_error(y_test, y_pred_pers)
    rmse_pers = np.sqrt(mean_squared_error(y_test, y_pred_pers))
    r2_pers = r2_score(y_test, y_pred_pers)
    
    # Training Mean baseline
    y_pred_mean = np.full_like(y_test, fill_value=y_train.mean())
    mae_mean = mean_absolute_error(y_test, y_pred_mean)
    rmse_mean = np.sqrt(mean_squared_error(y_test, y_pred_mean))
    r2_mean = r2_score(y_test, y_pred_mean)
    
    # ML Models Config
    models_config = {
        'Ridge Regression': {
            'estimator': Pipeline([('scaler', StandardScaler()), ('ridge', Ridge())]),
            'param_grid': {'ridge__alpha': [0.1, 1.0, 10.0, 100.0]}
        },
        'SVR': {
            'estimator': Pipeline([('scaler', StandardScaler()), ('svr', SVR(kernel='rbf'))]),
            'param_grid': {
                'svr__C': [0.1, 1.0, 10.0, 50.0],
                'svr__epsilon': [0.01, 0.05, 0.1],
                'svr__gamma': ['scale', 'auto', 0.01, 0.1]
            }
        },
        'Random Forest': {
            'estimator': RandomForestRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [3, 5, 8, None],
                'min_samples_split': [2, 5, 10]
            }
        },
        'Gradient Boosting': {
            'estimator': GradientBoostingRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1]
            }
        },
        'XGBoost': {
            'estimator': XGBRegressor(random_state=42, eval_metric='rmse'),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1]
            }
        }
    }
    
    results = [
        {'Model': 'Training Mean Baseline', 'MAE': mae_mean, 'RMSE': rmse_mean, 'R2': r2_mean},
        {'Model': 'Persistence Baseline', 'MAE': mae_pers, 'RMSE': rmse_pers, 'R2': r2_pers}
    ]
    
    fitted_models = {}
    test_preds = {
        'Persistence Baseline': y_pred_pers,
        'Training Mean Baseline': y_pred_mean
    }
    
    print("\nTuning & Retraining ML Models on Training Set...", flush=True)
    for name, config in models_config.items():
        grid = GridSearchCV(
            estimator=config['estimator'],
            param_grid=config['param_grid'],
            cv=tscv,
            scoring='neg_root_mean_squared_error',
            n_jobs=2
        )
        grid.fit(X_train, y_train)
        best_estimator = grid.best_estimator_
        fitted_models[name] = best_estimator
        
        y_pred = best_estimator.predict(X_test)
        test_preds[name] = y_pred
        
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        results.append({
            'Model': name,
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2,
            'best_params': grid.best_params_
        })
        print(f"  {name:<20} | MAE: {mae:.4f} kg | RMSE: {rmse:.4f} kg | R2: {r2:.4f}", flush=True)

    res_df = pd.DataFrame(results)
    
    # Identify Best Model (Priority: Lowest RMSE, Lowest MAE, Highest R2)
    ml_results = [r for r in results if 'best_params' in r]
    sorted_ml = sorted(ml_results, key=lambda x: (x['RMSE'], x['MAE'], -x['R2']))
    best_ml = sorted_ml[0]
    best_ml_name = best_ml['Model']
    best_ml_obj = fitted_models[best_ml_name]
    
    sorted_all = sorted(results, key=lambda x: (x['RMSE'], x['MAE'], -x['R2']))
    best_overall = sorted_all[0]
    
    print("\n==========================================")
    print("FINAL RESULTS TABLE (DAILY PRODUCTION TEST SET)")
    print("==========================================")
    print(res_df[['Model', 'MAE', 'RMSE', 'R2']].to_string(index=False))
    
    # 14. Save Best ML Model & Metadata
    best_model_path = os.path.join(models_dir, "daily_production_best_model.joblib")
    joblib.dump(best_ml_obj, best_model_path)
    print(f"\nSaved best ML model ({best_ml_name}) to: {best_model_path}")
    
    serializable_params = {}
    for k, v in best_ml['best_params'].items():
        if isinstance(v, (np.integer, np.int64)):
            serializable_params[k] = int(v)
        elif isinstance(v, (np.floating, np.float64)):
            serializable_params[k] = float(v)
        else:
            serializable_params[k] = v

    metadata = {
        "experiment": "Daily Honey Production Prediction",
        "best_ml_model": best_ml_name,
        "metrics": {
            "MAE": round(best_ml['MAE'], 4),
            "RMSE": round(best_ml['RMSE'], 4),
            "R2": round(best_ml['R2'], 4)
        },
        "best_hyperparameters": serializable_params,
        "feature_columns": feature_cols,
        "target_column": target_col,
        "train_date_range": [train_start_str, train_end_str],
        "test_date_range": [test_start_str, test_end_str],
        "excluded_harvest_dates": ["2024-04-30", "2024-08-31", "2024-12-31"],
        "dataset_limitations": (
            "Daily honey production was derived as first-differences of measured hive weight. "
            "Negative drops correspond to human harvesting operations, not negative biological production. "
            "Results represent a single hive in 2024 and cannot be assumed to reflect general Indian beekeeping conditions."
        )
    }
    
    metadata_path = os.path.join(out_dir, "daily_production_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"Saved metadata to: {metadata_path}")
    
    # 15. Create Plots
    
    # Plot 1: Daily Production Over Time (Whole Year with Harvest Drops)
    plt.figure(figsize=(12, 5))
    plt.plot(df['parsed_date'], df['daily_honey_production'], color='#1f77b4', linewidth=1.5, label='Daily Change (Δ kg/day)')
    plt.axhline(0, color='black', linestyle='--', alpha=0.6)
    plt.title('Daily Change in Hive Honey Weight Over Time (2024)', fontsize=13, fontweight='bold')
    plt.xlabel('Date', fontsize=11)
    plt.ylabel('Weight Change (kg/day)', fontsize=11)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "daily_production_timeline.png"), dpi=300)
    plt.close()
    
    # Plot 2: Production Distribution (Non-Extraction Days)
    plt.figure(figsize=(8, 5))
    sns.histplot(non_ext_df['daily_honey_production'], kde=True, color='#2b5c8f', bins=30)
    plt.title('Distribution of Daily Honey Production (Non-Extraction Days)', fontsize=13, fontweight='bold')
    plt.xlabel('Daily Production (kg/day)', fontsize=11)
    plt.ylabel('Frequency', fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "production_distribution.png"), dpi=300)
    plt.close()
    
    # Plot 3: Actual vs Predicted (Best ML Model on Test Set)
    plt.figure(figsize=(8, 6))
    plt.scatter(y_test, test_preds[best_ml_name], color='#2ca02c', alpha=0.8, edgecolors='k', s=60, label=f'Predictions ({best_ml_name})')
    min_v = min(y_test.min(), min(test_preds[best_ml_name]))
    max_v = max(y_test.max(), max(test_preds[best_ml_name]))
    plt.plot([min_v, max_v], [min_v, max_v], 'r--', linewidth=2, label='Ideal 1:1 Line')
    plt.xlabel('Actual Daily Production (kg/day)', fontsize=11, fontweight='bold')
    plt.ylabel('Predicted Daily Production (kg/day)', fontsize=11, fontweight='bold')
    plt.title(f'Actual vs Predicted Daily Production ({best_ml_name})', fontsize=12, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "actual_vs_predicted.png"), dpi=300)
    plt.close()
    
    # Plot 4: Model Comparison (Bar Plot)
    plt.figure(figsize=(10, 6))
    model_names_plot = [r['Model'] for r in results]
    maes_plot = [r['MAE'] for r in results]
    rmses_plot = [r['RMSE'] for r in results]
    
    x = np.arange(len(model_names_plot))
    width = 0.35
    plt.bar(x - width/2, rmses_plot, width, label='RMSE (lower is better)', color='#d95f02')
    plt.bar(x + width/2, maes_plot, width, label='MAE (lower is better)', color='#7570b3')
    plt.xticks(x, model_names_plot, rotation=25, ha='right', fontweight='bold')
    plt.ylabel('Error (kg/day)', fontsize=11, fontweight='bold')
    plt.title('Daily Production Error Comparison (Untouched Test Set)', fontsize=12, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "model_comparison.png"), dpi=300)
    plt.close()
    
    # Plot 5: Extraction Event Visualization
    plt.figure(figsize=(10, 5))
    plt.plot(df['parsed_date'], df['Honey Weight (kg)'], color='#3182bd', linewidth=2, label='Honey Weight (kg)')
    for idx, row in extraction_df.iterrows():
        plt.scatter(row['parsed_date'], row['Honey Weight (kg)'], color='red', s=100, zorder=5, label='Extraction Event' if idx==119 else "")
        plt.annotate(f"Harvest ({row['parsed_date'].strftime('%b %d')})\nΔ = {row['daily_honey_production']:.1f} kg",
                     (row['parsed_date'], row['Honey Weight (kg)']),
                     textcoords="offset points", xytext=(-30, -35), ha='center',
                     arrowprops=dict(arrowstyle="->", color='red', lw=1.5))
    plt.title('Hive Honey Weight & Human Extraction Events (2024)', fontsize=13, fontweight='bold')
    plt.xlabel('Date', fontsize=11)
    plt.ylabel('Honey Weight (kg)', fontsize=11)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "extraction_events.png"), dpi=300)
    plt.close()
    
    # 16. Summary & Findings Output
    print("\n==========================================")
    print("16. SUMMARY & VERDICT")
    print("==========================================")
    print(f"Best Overall Method: {best_overall['Model']} (MAE={best_overall['MAE']:.4f} kg, RMSE={best_overall['RMSE']:.4f} kg, R2={best_overall['R2']:.4f})")
    print(f"Best ML Model:       {best_ml_name} (MAE={best_ml['MAE']:.4f} kg, RMSE={best_ml['RMSE']:.4f} kg, R2={best_ml['R2']:.4f})")
    
    beats_pers = best_ml['RMSE'] < rmse_pers or best_ml['MAE'] < mae_pers
    print(f"Does ML Beat Persistence? {beats_pers}")
    
    print("\n[Important Dataset & Biological Limitations]:")
    print("1. The dataset measures raw hive weight over 365 days for 1 hive in 2024.")
    print("2. First-differenced weight changes reflect net daily weight changes (nectar gain minus bee respiration/evaporation).")
    print("3. Negative drops reflect human harvesting operations, not negative biological honey production by bees.")
    print("4. This dataset cannot be claimed to represent true gross biological nectar foraging or general Indian beekeeping conditions without external validation.")

if __name__ == "__main__":
    main()
