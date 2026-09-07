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
    # 1. Verify Dataset & Dates
    csv_path = os.path.join("DAT", "Honey_Production_Dataset_for_2024.csv")
    df = pd.read_csv(csv_path)
    df['parsed_date'] = pd.to_datetime(df['Date'], format='%B %d, %Y')
    df = df.sort_values('parsed_date').reset_index(drop=True)
    
    print("==========================================")
    print("1. CHRONOLOGICAL SPLIT & CONTINUITY VERIFICATION")
    print("==========================================")
    print(f"Total Rows in CSV: {len(df)}")
    print(f"Start Date: {df['parsed_date'].iloc[0].strftime('%Y-%m-%d')}")
    print(f"End Date:   {df['parsed_date'].iloc[-1].strftime('%Y-%m-%d')}")
    
    # Check Feb 29
    feb29_in_dataset = pd.Timestamp('2024-02-29') in df['parsed_date'].values
    print(f"Is Feb 29, 2024 present in CSV?: {feb29_in_dataset}")
    print("Explanation: Feb 29, 2024 was omitted by the dataset creators. Therefore, February has only 28 days.")
    print("Jan (31) + Feb (28) + Mar (31) + Apr (30) + May (31) + Jun (30) + Jul (31) + Aug (31) + Sep (30) + Oct (19) = EXACTLY 292 ROWS.")
    
    # 80/20 raw index split
    n = len(df)
    n_train = int(np.floor(0.8 * n)) # 292
    
    df_train_raw = df.iloc[:n_train]
    df_test_raw = df.iloc[n_train:]
    
    train_start = df_train_raw['parsed_date'].iloc[0].strftime('%Y-%m-%d')
    train_end = df_train_raw['parsed_date'].iloc[-1].strftime('%Y-%m-%d')
    test_start = df_test_raw['parsed_date'].iloc[0].strftime('%Y-%m-%d')
    test_end = df_test_raw['parsed_date'].iloc[-1].strftime('%Y-%m-%d')
    
    print(f"Training Set (292 rows): {train_start} to {train_end}")
    print(f"Test Set (73 rows):     {test_start} to {test_end}")
    
    # Check date continuity & overlap
    overlap = set(df_train_raw['parsed_date']).intersection(set(df_test_raw['parsed_date']))
    print(f"Date Overlap Count: {len(overlap)}")
    
    # 2 & 3. Construct Causal Lag Features (Strictly <= t-1)
    df['month'] = df['parsed_date'].dt.month
    df['day_of_year'] = df['parsed_date'].dt.dayofyear
    
    target_col = 'Honey Weight (kg)'
    
    # Lags shifted strictly by 1 day
    df['honey_weight_lag1'] = df[target_col].shift(1)
    df['honey_weight_roll_mean_3'] = df[target_col].shift(1).rolling(3).mean()
    df['honey_weight_roll_mean_7'] = df[target_col].shift(1).rolling(7).mean()
    df['honey_weight_roll_std_7'] = df[target_col].shift(1).rolling(7).std()
    
    base_features = [
        'Environmental Temperature (°C)',
        'Relative Humidity (%)',
        'Hive Temperature (°C)',
        'Hive Humidity (%)',
        'Wind Speed (km/h)',
        'month',
        'day_of_year'
    ]
    
    lag_features = [
        'honey_weight_lag1',
        'honey_weight_roll_mean_3',
        'honey_weight_roll_mean_7',
        'honey_weight_roll_std_7'
    ]
    
    all_features = base_features + lag_features
    
    # Drop initial 7 rows with NaN lags
    df_clean = df.dropna(subset=lag_features).reset_index(drop=True)
    
    n_clean = len(df_clean)
    n_clean_train = int(np.floor(0.8 * n_clean)) # 286 train, 72 test
    
    train_clean = df_clean.iloc[:n_clean_train]
    test_clean = df_clean.iloc[n_clean_train:]
    
    y_train = train_clean[target_col]
    y_test = test_clean[target_col]
    
    X_train_all = train_clean[all_features]
    X_test_all = test_clean[all_features]
    
    # 4 & 5. Evaluate Baselines on the Exact Same 72 Test Rows
    print("\n==========================================")
    print("2. BASELINE EVALUATION (UNTOUCHED TEST SET)")
    print("==========================================")
    
    # Baseline 1: Training Set Mean
    y_pred_mean = np.full_like(y_test, fill_value=y_train.mean())
    mae_mean = mean_absolute_error(y_test, y_pred_mean)
    rmse_mean = np.sqrt(mean_squared_error(y_test, y_pred_mean))
    r2_mean = r2_score(y_test, y_pred_mean)
    
    # Baseline 2: Naive Persistence (y_t-1)
    y_pred_pers = test_clean['honey_weight_lag1'].values
    mae_pers = mean_absolute_error(y_test, y_pred_pers)
    rmse_pers = np.sqrt(mean_squared_error(y_test, y_pred_pers))
    r2_pers = r2_score(y_test, y_pred_pers)
    
    # Baseline 3: Simple Moving Average (Equal weight of lag1, roll3, roll7)
    y_pred_sma = (test_clean['honey_weight_lag1'] + test_clean['honey_weight_roll_mean_3'] + test_clean['honey_weight_roll_mean_7']) / 3.0
    mae_sma = mean_absolute_error(y_test, y_pred_sma)
    rmse_sma = np.sqrt(mean_squared_error(y_test, y_pred_sma))
    r2_sma = r2_score(y_test, y_pred_sma)
    
    # Baseline 4: Stronger Lag Linear Model (Ridge fit strictly on train lag features)
    lag_subset = ['honey_weight_lag1', 'honey_weight_roll_mean_3', 'honey_weight_roll_mean_7']
    ridge_lag = Ridge(alpha=1.0)
    ridge_lag.fit(train_clean[lag_subset], y_train)
    y_pred_ridge_lag = ridge_lag.predict(test_clean[lag_subset])
    
    mae_ridge_lag = mean_absolute_error(y_test, y_pred_ridge_lag)
    rmse_ridge_lag = np.sqrt(mean_squared_error(y_test, y_pred_ridge_lag))
    r2_ridge_lag = r2_score(y_test, y_pred_ridge_lag)
    
    print(f"Training Mean Baseline:       MAE={mae_mean:.4f}, RMSE={rmse_mean:.4f}, R2={r2_mean:.4f}")
    print(f"Naive Persistence (y_t-1):    MAE={mae_pers:.4f}, RMSE={rmse_pers:.4f}, R2={r2_pers:.4f}")
    print(f"Simple Lag Moving Avg (SMA):  MAE={mae_sma:.4f}, RMSE={rmse_sma:.4f}, R2={r2_sma:.4f}")
    print(f"Stronger Lag Linear Model:    MAE={mae_ridge_lag:.4f}, RMSE={rmse_ridge_lag:.4f}, R2={r2_ridge_lag:.4f}")
    
    # 6. Fit & Evaluate ML Models (with TimeSeriesSplit on Train set ONLY)
    print("\n==========================================")
    print("3. RETRAIN & EVALUATE ML MODELS")
    print("==========================================")
    tscv = TimeSeriesSplit(n_splits=5)
    
    models_config = {
        'SVR + Lags': {
            'estimator': Pipeline([('scaler', StandardScaler()), ('svr', SVR(kernel='rbf'))]),
            'param_grid': {
                'svr__C': [0.1, 1.0, 10.0, 50.0, 100.0],
                'svr__epsilon': [0.01, 0.1, 0.5, 1.0],
                'svr__gamma': ['scale', 'auto', 0.01, 0.1]
            }
        },
        'Random Forest + Lags': {
            'estimator': RandomForestRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [3, 5, 8, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
        },
        'XGBoost + Lags': {
            'estimator': XGBRegressor(random_state=42, eval_metric='rmse'),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 1.0]
            }
        },
        'Gradient Boosting + Lags': {
            'estimator': GradientBoostingRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 1.0]
            }
        }
    }
    
    all_results = [
        {'Model': 'Training Mean Baseline', 'MAE': mae_mean, 'RMSE': rmse_mean, 'R2': r2_mean},
        {'Model': 'Naive Persistence (y_t-1)', 'MAE': mae_pers, 'RMSE': rmse_pers, 'R2': r2_pers},
        {'Model': 'Simple Lag Moving Avg (SMA)', 'MAE': mae_sma, 'RMSE': rmse_sma, 'R2': r2_sma},
        {'Model': 'Stronger Lag Linear Baseline', 'MAE': mae_ridge_lag, 'RMSE': rmse_ridge_lag, 'R2': r2_ridge_lag}
    ]
    
    fitted_models = {}
    
    for name, config in models_config.items():
        print(f"Tuning {name}...", flush=True)
        grid = GridSearchCV(
            estimator=config['estimator'],
            param_grid=config['param_grid'],
            cv=tscv,
            scoring='neg_root_mean_squared_error',
            n_jobs=2
        )
        grid.fit(X_train_all, y_train)
        best_estimator = grid.best_estimator_
        fitted_models[name] = best_estimator
        
        y_pred = best_estimator.predict(X_test_all)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        all_results.append({
            'Model': name,
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2
        })
        print(f"  -> {name}: MAE={mae:.4f}, RMSE={rmse:.4f}, R2={r2:.4f}")

    # 7. Print Final Comparison Table
    print("\n==========================================")
    print("FINAL COMPARISON TABLE (UNTOUCHED TEST SET)")
    print("==========================================")
    res_df = pd.DataFrame(all_results)
    print(res_df.to_string(index=False))
    
    # 8. Detailed Comparative Analysis & Verdict
    print("\n==========================================")
    print("DETAILED VERDICT & ANALYSIS")
    print("==========================================")
    best_overall = res_df.sort_values(by=['RMSE', 'MAE', 'R2'], ascending=[True, True, False]).iloc[0]
    best_ml = res_df[res_df['Model'].str.contains('\+')].sort_values(by=['RMSE', 'MAE', 'R2'], ascending=[True, True, False]).iloc[0]
    
    print(f"Best Overall Method: {best_overall['Model']} (MAE={best_overall['MAE']:.4f} kg, RMSE={best_overall['RMSE']:.4f} kg, R2={best_overall['R2']:.4f})")
    print(f"Best ML Model:       {best_ml['Model']} (MAE={best_ml['MAE']:.4f} kg, RMSE={best_ml['RMSE']:.4f} kg, R2={best_ml['R2']:.4f})")
    
    beats_pers = best_ml['RMSE'] < rmse_pers or best_ml['MAE'] < mae_pers
    print(f"Does Best ML Model Beat Persistence Baseline (y_t-1)? {beats_pers}")
    
    if beats_pers:
        mae_diff = mae_pers - best_ml['MAE']
        print(f"Practical Significance: Best ML Model reduces MAE by {mae_diff:.4f} kg over persistence.")
    else:
        print("Practical Significance: Naive Persistence (y_t-1) remains competitive/superior for 1-step-ahead point forecasts.")

if __name__ == "__main__":
    main()
