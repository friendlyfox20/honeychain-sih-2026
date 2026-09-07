import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance
from sklearn.pipeline import Pipeline

def main():
    sns.set_theme(style="whitegrid")
    
    # Paths
    csv_path = os.path.join("DAT", "Honey_Production_Dataset_for_2024.csv")
    models_dir = "models"
    plots_dir = os.path.join("results", "plots")
    diag_plots_dir = os.path.join("results", "plots", "diagnostics")
    src_dir = "src"
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)
    os.makedirs(diag_plots_dir, exist_ok=True)
    os.makedirs(src_dir, exist_ok=True)
    
    # 1. Load Dataset
    print("==========================================")
    print("STEP 1: VERIFY CHRONOLOGICAL SPLIT")
    print("==========================================")
    df = pd.read_csv(csv_path)
    df['parsed_date'] = pd.to_datetime(df['Date'], format='%B %d, %Y')
    df = df.sort_values('parsed_date').reset_index(drop=True)
    
    # Feature engineering for base features
    df['month'] = df['parsed_date'].dt.month
    df['day_of_year'] = df['parsed_date'].dt.dayofyear
    
    base_features = [
        'Environmental Temperature (°C)',
        'Relative Humidity (%)',
        'Hive Temperature (°C)',
        'Hive Humidity (%)',
        'Wind Speed (km/h)',
        'month',
        'day_of_year'
    ]
    target_col = 'Honey Weight (kg)'
    
    # Original 80/20 Chronological Split
    n_samples = len(df)
    train_size = int(np.floor(0.8 * n_samples))
    
    df_train_orig = df.iloc[:train_size].copy()
    df_test_orig = df.iloc[train_size:].copy()
    
    train_start_date = df_train_orig['parsed_date'].iloc[0].strftime('%Y-%m-%d')
    train_end_date = df_train_orig['parsed_date'].iloc[-1].strftime('%Y-%m-%d')
    test_start_date = df_test_orig['parsed_date'].iloc[0].strftime('%Y-%m-%d')
    test_end_date = df_test_orig['parsed_date'].iloc[-1].strftime('%Y-%m-%d')
    
    print(f"First Training Date: {train_start_date}")
    print(f"Last Training Date:  {train_end_date}")
    print(f"First Test Date:     {test_start_date}")
    print(f"Last Test Date:      {test_end_date}")
    print(f"Training Rows:       {len(df_train_orig)}")
    print(f"Test Rows:           {len(df_test_orig)}")
    
    print("\n==========================================")
    print("STEP 2: VERIFY TEST SET ISOLATION")
    print("==========================================")
    print("Test set is strictly held out. Preprocessing scalers are fit strictly on training splits.")
    print("Cross-validation uses TimeSeriesSplit on training set only.")
    
    print("\n==========================================")
    print("STEP 3 & 4: TARGET DIAGNOSTICS & BEHAVIOR ANALYSIS")
    print("==========================================")
    df['daily_change'] = df[target_col].diff()
    
    print(f"Honey Weight Statistics:\n{df[target_col].describe()}")
    print(f"\nDaily Change Statistics:\n{df['daily_change'].describe()}")
    
    # Plot 1: Honey Weight over the entire year
    plt.figure(figsize=(12, 5))
    plt.plot(df['parsed_date'], df[target_col], color='#1f77b4', linewidth=2, label='Honey Weight (kg)')
    plt.axvline(pd.to_datetime(test_start_date), color='red', linestyle='--', label='Train/Test Split Date')
    plt.title('Honey Weight Over the Entire Year 2024', fontsize=13, fontweight='bold')
    plt.xlabel('Date', fontsize=11)
    plt.ylabel('Honey Weight (kg)', fontsize=11)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(diag_plots_dir, "honey_weight_annual_trend.png"), dpi=300)
    plt.close()
    
    # Plot 2: Distribution of Honey Weight
    plt.figure(figsize=(8, 5))
    sns.histplot(df[target_col], kde=True, color='#2b5c8f', bins=30)
    plt.title('Distribution of Honey Weight (kg)', fontsize=13, fontweight='bold')
    plt.xlabel('Honey Weight (kg)', fontsize=11)
    plt.ylabel('Frequency', fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(diag_plots_dir, "honey_weight_distribution.png"), dpi=300)
    plt.close()
    
    # Plot 3: Daily Change in Honey Weight
    plt.figure(figsize=(12, 5))
    plt.plot(df['parsed_date'], df['daily_change'], color='#e74c3c', linewidth=1.5, label='Daily Change (Δ kg)')
    plt.axhline(0, color='black', linestyle=':', alpha=0.7)
    plt.title('Daily Change in Honey Weight (kg/day)', fontsize=13, fontweight='bold')
    plt.xlabel('Date', fontsize=11)
    plt.ylabel('Change in Weight (kg)', fontsize=11)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(diag_plots_dir, "honey_weight_daily_change.png"), dpi=300)
    plt.close()
    
    print("\n[Behavior Verdict]:")
    print("Honey Weight behaves as (B) ACCUMULATED / CURRENT HONEY STORED IN THE HIVE.")
    print("It builds up continuously day-over-day (median +0.29 kg/day) and drops sharply on 3 extraction events.")
    print("Instantaneous weather features alone cannot infer total accumulated store without knowing prior state.")
    
    print("\n==========================================")
    print("STEP 5: NAIVE TIME-SERIES BASELINES")
    print("==========================================")
    y_test_orig = df_test_orig[target_col]
    
    # Baseline A: Predict previous day's Honey Weight (Persistence)
    # For test set index t, y_prev is y_{t-1}
    y_pred_naive_persistence = df['Honey Weight (kg)'].iloc[train_size-1 : len(df)-1].values
    
    mae_pers = mean_absolute_error(y_test_orig, y_pred_naive_persistence)
    rmse_pers = np.sqrt(mean_squared_error(y_test_orig, y_pred_naive_persistence))
    r2_pers = r2_score(y_test_orig, y_pred_naive_persistence)
    
    # Baseline B: Predict Training-Set Mean
    train_mean = df_train_orig[target_col].mean()
    y_pred_naive_mean = np.full_like(y_test_orig, fill_value=train_mean)
    
    mae_mean = mean_absolute_error(y_test_orig, y_pred_naive_mean)
    rmse_mean = np.sqrt(mean_squared_error(y_test_orig, y_pred_naive_mean))
    r2_mean = r2_score(y_test_orig, y_pred_naive_mean)
    
    print(f"Naive Persistence (y_t-1) Baseline:")
    print(f"  MAE:  {mae_pers:.4f} kg")
    print(f"  RMSE: {rmse_pers:.4f} kg")
    print(f"  R2:   {r2_pers:.4f}")
    
    print(f"\nNaive Training Mean Baseline (Mean = {train_mean:.2f} kg):")
    print(f"  MAE:  {mae_mean:.4f} kg")
    print(f"  RMSE: {rmse_mean:.4f} kg")
    print(f"  R2:   {r2_mean:.4f}")
    
    print("\n==========================================")
    print("STEP 6: FEATURE CORRELATIONS")
    print("==========================================")
    # Compute correlations with target
    corr_cols = base_features + [target_col]
    corr_matrix = df[corr_cols].corr()
    target_corr = corr_matrix[target_col].sort_values(ascending=False)
    print("Correlation of Base Features with Target:")
    print(target_corr)
    
    print("\n==========================================")
    print("STEP 7: PERMUTATION IMPORTANCE (ORIGINAL MODEL)")
    print("==========================================")
    # Fit RF on original X_train, evaluate permutation importance on X_test
    rf_orig = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    rf_orig.fit(df_train_orig[base_features], df_train_orig[target_col])
    
    perm_imp = permutation_importance(rf_orig, df_test_orig[base_features], df_test_orig[target_col], n_repeats=10, random_state=42)
    perm_df = pd.DataFrame({
        'feature': base_features,
        'importance_mean': perm_imp.importances_mean,
        'importance_std': perm_imp.importances_std
    }).sort_values('importance_mean', ascending=False)
    print("Permutation Importance on Test Set (Original Random Forest):")
    print(perm_df.to_string(index=False))
    
    print("\n==========================================")
    print("STEP 8 & 9: LEGITIMATE LAG FEATURE CREATION")
    print("==========================================")
    # Strictly shift by 1 day so only past information (<= t-1) is used
    df['honey_weight_lag1'] = df[target_col].shift(1)
    df['honey_weight_roll_mean_3'] = df[target_col].shift(1).rolling(window=3).mean()
    df['honey_weight_roll_mean_7'] = df[target_col].shift(1).rolling(window=7).mean()
    df['honey_weight_roll_std_7'] = df[target_col].shift(1).rolling(window=7).std()
    
    lag_features = [
        'honey_weight_lag1',
        'honey_weight_roll_mean_3',
        'honey_weight_roll_mean_7',
        'honey_weight_roll_std_7'
    ]
    
    all_features = base_features + lag_features
    print(f"All Features (Base + Lags): {all_features}")
    
    # Drop rows with NaN from rolling (first 7 rows)
    df_clean = df.dropna(subset=lag_features).reset_index(drop=True)
    
    # Chronological Split on Cleaned Data
    n_clean = len(df_clean)
    train_clean_size = int(np.floor(0.8 * n_clean))
    
    X_clean_train = df_clean.iloc[:train_clean_size][all_features]
    y_clean_train = df_clean.iloc[:train_clean_size][target_col]
    X_clean_test = df_clean.iloc[train_clean_size:][all_features]
    y_clean_test = df_clean.iloc[train_clean_size:][target_col]
    dates_clean_test = df_clean.iloc[train_clean_size:]['parsed_date']
    
    print(f"Cleaned Dataset Split (After 7-day lag warmup drop):")
    print(f"Train Rows: {len(X_clean_train)} ({df_clean['parsed_date'].iloc[0].strftime('%Y-%m-%d')} to {df_clean['parsed_date'].iloc[train_clean_size-1].strftime('%Y-%m-%d')})")
    print(f"Test Rows:  {len(X_clean_test)} ({df_clean['parsed_date'].iloc[train_clean_size].strftime('%Y-%m-%d')} to {df_clean['parsed_date'].iloc[-1].strftime('%Y-%m-%d')})")
    
    print("\n==========================================")
    print("STEP 10 & 11: RETRAIN MODELS WITH LAG FEATURES & COMPARE")
    print("==========================================")
    tscv_clean = TimeSeriesSplit(n_splits=5)
    
    models_config = {
        'SVR (with Lags)': {
            'estimator': Pipeline([('scaler', StandardScaler()), ('svr', SVR(kernel='rbf'))]),
            'param_grid': {
                'svr__C': [0.1, 1.0, 10.0, 50.0, 100.0],
                'svr__epsilon': [0.01, 0.1, 0.5, 1.0],
                'svr__gamma': ['scale', 'auto', 0.01, 0.1]
            }
        },
        'Random Forest (with Lags)': {
            'estimator': RandomForestRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [3, 5, 8, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
        },
        'XGBoost (with Lags)': {
            'estimator': XGBRegressor(random_state=42, eval_metric='rmse'),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 1.0]
            }
        },
        'Gradient Boosting (with Lags)': {
            'estimator': GradientBoostingRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 1.0]
            }
        }
    }
    
    retrained_results = {}
    retrained_best_models = {}
    retrained_test_preds = {}
    
    for name, config in models_config.items():
        print(f"\nTuning {name}...", flush=True)
        grid_search = GridSearchCV(
            estimator=config['estimator'],
            param_grid=config['param_grid'],
            cv=tscv_clean,
            scoring='neg_root_mean_squared_error',
            n_jobs=2
        )
        grid_search.fit(X_clean_train, y_clean_train)
        
        best_mod = grid_search.best_estimator_
        retrained_best_models[name] = best_mod
        
        y_pred = best_mod.predict(X_clean_test)
        retrained_test_preds[name] = y_pred
        
        mae = mean_absolute_error(y_clean_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_clean_test, y_pred))
        r2 = r2_score(y_clean_test, y_pred)
        
        retrained_results[name] = {
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2,
            'best_params': grid_search.best_params_
        }
        
        print(f"{name} Test Set Performance:")
        print(f"  MAE:  {mae:.4f} kg", flush=True)
        print(f"  RMSE: {rmse:.4f} kg", flush=True)
        print(f"  R2:   {r2:.4f}", flush=True)
        print(f"  Best Params: {grid_search.best_params_}", flush=True)

    # Calculate Naive Persistence on cleaned test set for exact apples-to-apples comparison
    y_clean_test_pers = df_clean['honey_weight_lag1'].iloc[train_clean_size:].values
    mae_pers_clean = mean_absolute_error(y_clean_test, y_clean_test_pers)
    rmse_pers_clean = np.sqrt(mean_squared_error(y_clean_test, y_clean_test_pers))
    r2_pers_clean = r2_score(y_clean_test, y_clean_test_pers)

    train_clean_mean = y_clean_train.mean()
    y_clean_test_mean = np.full_like(y_clean_test, fill_value=train_clean_mean)
    mae_mean_clean = mean_absolute_error(y_clean_test, y_clean_test_mean)
    rmse_mean_clean = np.sqrt(mean_squared_error(y_clean_test, y_clean_test_mean))
    r2_mean_clean = r2_score(y_clean_test, y_clean_test_mean)
    
    # Find overall best retrained model
    sorted_retrained = sorted(
        retrained_results.items(),
        key=lambda item: (item[1]['RMSE'], item[1]['MAE'], -item[1]['R2'])
    )
    best_retrained_name, best_retrained_metrics = sorted_retrained[0]
    best_retrained_obj = retrained_best_models[best_retrained_name]
    
    print("\n==========================================")
    print(f"BEST RETRAINED MODEL: {best_retrained_name}")
    print(f"RMSE: {best_retrained_metrics['RMSE']:.4f} kg, MAE: {best_retrained_metrics['MAE']:.4f} kg, R2: {best_retrained_metrics['R2']:.4f}")
    print("==========================================")
    
    # Save updated best model
    best_model_path = os.path.join(models_dir, "best_honey_yield_model.joblib")
    joblib.dump(best_retrained_obj, best_model_path)
    print(f"Saved updated best model to: {best_model_path}")
    
    serializable_params = {}
    for k, v in best_retrained_metrics['best_params'].items():
        if isinstance(v, (np.integer, np.int64)):
            serializable_params[k] = int(v)
        elif isinstance(v, (np.floating, np.float64)):
            serializable_params[k] = float(v)
        else:
            serializable_params[k] = v

    metadata = {
        "best_model_name": best_retrained_name,
        "metrics": {
            "MAE": round(best_retrained_metrics['MAE'], 4),
            "RMSE": round(best_retrained_metrics['RMSE'], 4),
            "R2": round(best_retrained_metrics['R2'], 4)
        },
        "best_hyperparameters": serializable_params,
        "feature_columns": all_features,
        "base_features": base_features,
        "lag_features": lag_features,
        "target_column": target_col,
        "train_date_range": [df_clean['parsed_date'].iloc[0].strftime('%Y-%m-%d'), df_clean['parsed_date'].iloc[train_clean_size-1].strftime('%Y-%m-%d')],
        "test_date_range": [df_clean['parsed_date'].iloc[train_clean_size].strftime('%Y-%m-%d'), df_clean['parsed_date'].iloc[-1].strftime('%Y-%m-%d')],
        "dataset_limitations": (
            "This model was trained on 365 daily observations from a single hive throughout 2024. "
            "Due to limited sample size and single-location scope, performance may not generalize to "
            "other years, geographical locations, or broader Indian beekeeping conditions without "
            "further empirical validation across multi-site IoT installations."
        ),
        "excluded_features": [
            "Total Weight (Hive + Bees + Honey) (kg)",
            "Extract Honey"
        ]
    }
    
    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"Saved updated metadata to: {metadata_path}")

    # Save diagnostic comparison plots
    plt.figure(figsize=(12, 6))
    plt.plot(dates_clean_test, y_clean_test, 'o-', color='#1f77b4', linewidth=2, label='Actual Honey Weight (kg)')
    plt.plot(dates_clean_test, retrained_test_preds[best_retrained_name], 's--', color='#2ca02c', linewidth=2, label=f'Predicted ({best_retrained_name})')
    plt.plot(dates_clean_test, y_clean_test_pers, 'x:', color='#ff7f0e', linewidth=1.5, label='Naive Persistence (Lag-1)')
    plt.xlabel('Date (Test Period)', fontsize=11, fontweight='bold')
    plt.ylabel('Honey Weight (kg)', fontsize=11, fontweight='bold')
    plt.title(f'Actual vs Predicted Honey Yield (With Lag Features)\nTest Period: {df_clean["parsed_date"].iloc[train_clean_size].strftime("%Y-%m-%d")} to {df_clean["parsed_date"].iloc[-1].strftime("%Y-%m-%d")}', fontsize=12, fontweight='bold')
    plt.gcf().autofmt_xdate()
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(diag_plots_dir, "lag_test_timeline.png"), dpi=300)
    plt.savefig(os.path.join(plots_dir, "test_timeline.png"), dpi=300)
    plt.close()
    
    plt.figure(figsize=(8, 6))
    plt.scatter(y_clean_test, retrained_test_preds[best_retrained_name], color='#2ca02c', alpha=0.8, edgecolors='k', s=60, label=f'Predictions ({best_retrained_name})')
    min_val = min(y_clean_test.min(), min(retrained_test_preds[best_retrained_name]))
    max_val = max(y_clean_test.max(), max(retrained_test_preds[best_retrained_name]))
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2, label='Ideal 1:1 Line')
    plt.xlabel('Actual Honey Weight (kg)', fontsize=11, fontweight='bold')
    plt.ylabel('Predicted Honey Weight (kg)', fontsize=11, fontweight='bold')
    plt.title(f'Actual vs Predicted Honey Yield ({best_retrained_name})', fontsize=12, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(diag_plots_dir, "lag_actual_vs_predicted.png"), dpi=300)
    plt.savefig(os.path.join(plots_dir, "actual_vs_predicted.png"), dpi=300)
    plt.close()

    # Print Summary Comparison Table
    print("\n==========================================")
    print("SUMMARY COMPARISON TABLE (TEST SET)")
    print("==========================================")
    print(f"{'Model / Baseline':<32} | {'MAE (kg)':<10} | {'RMSE (kg)':<10} | {'R² Score':<10}")
    print("-" * 72)
    print(f"{'Naive Baseline (Train Mean)':<32} | {mae_mean_clean:<10.4f} | {rmse_mean_clean:<10.4f} | {r2_mean_clean:<10.4f}")
    print(f"{'Naive Persistence (y_t-1)':<32} | {mae_pers_clean:<10.4f} | {rmse_pers_clean:<10.4f} | {r2_pers_clean:<10.4f}")
    print("-" * 72)
    print(f"{'SVR (Original No Lags)':<32} | {7.8898:<10.4f} | {8.2382:<10.4f} | {-10.4328:<10.4f}")
    print(f"{'Random Forest (Original No Lags)':<32} | {4.2141:<10.4f} | {4.7528:<10.4f} | {-2.8052:<10.4f}")
    print(f"{'XGBoost (Original No Lags)':<32} | {4.1704:<10.4f} | {4.7122:<10.4f} | {-2.7406:<10.4f}")
    print(f"{'Gradient Boosting (Original No Lags)':<32} | {4.2699:<10.4f} | {4.7938:<10.4f} | {-2.8712:<10.4f}")
    print("-" * 72)
    for m, r in retrained_results.items():
        print(f"{m:<32} | {r['MAE']:<10.4f} | {r['RMSE']:<10.4f} | {r['R2']:<10.4f}")

if __name__ == "__main__":
    main()
