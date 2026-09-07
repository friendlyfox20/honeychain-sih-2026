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
from sklearn.pipeline import Pipeline

def main():
    # Set plot style
    sns.set_theme(style="whitegrid")
    
    # Paths
    csv_path = os.path.join("DAT", "Honey_Production_Dataset_for_2024.csv")
    models_dir = "models"
    plots_dir = os.path.join("results", "plots")
    src_dir = "src"
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)
    os.makedirs(src_dir, exist_ok=True)
    
    # 1. Load Dataset
    print("Loading dataset from:", csv_path)
    df = pd.read_csv(csv_path)
    
    # Parse Date
    df['parsed_date'] = pd.to_datetime(df['Date'], format='%B %d, %Y')
    df = df.sort_values('parsed_date').reset_index(drop=True)
    
    # Feature Engineering
    df['month'] = df['parsed_date'].dt.month
    df['day_of_year'] = df['parsed_date'].dt.dayofyear
    
    feature_cols = [
        'Environmental Temperature (°C)',
        'Relative Humidity (%)',
        'Hive Temperature (°C)',
        'Hive Humidity (%)',
        'Wind Speed (km/h)',
        'month',
        'day_of_year'
    ]
    target_col = 'Honey Weight (kg)'
    
    print("Final Features:", feature_cols)
    print("Target:", target_col)
    
    X = df[feature_cols]
    y = df[target_col]
    
    # 2. Chronological Split (80% Train, 20% Test)
    n_samples = len(df)
    train_size = int(np.floor(0.8 * n_samples))
    
    X_train, X_test = X.iloc[:train_size], X.iloc[train_size:]
    y_train, y_test = y.iloc[:train_size], y.iloc[train_size:]
    dates_train, dates_test = df['parsed_date'].iloc[:train_size], df['parsed_date'].iloc[train_size:]
    
    train_start_str = dates_train.iloc[0].strftime('%Y-%m-%d')
    train_end_str = dates_train.iloc[-1].strftime('%Y-%m-%d')
    test_start_str = dates_test.iloc[0].strftime('%Y-%m-%d')
    test_end_str = dates_test.iloc[-1].strftime('%Y-%m-%d')
    
    print(f"\nChronological Split:")
    print(f"Train samples: {len(X_train)} ({train_start_str} to {train_end_str})")
    print(f"Test samples: {len(X_test)} ({test_start_str} to {test_end_str})")
    
    # 3. Cross-Validation Setup (TimeSeriesSplit on Train set ONLY)
    tscv = TimeSeriesSplit(n_splits=5)
    
    # Define Models and Hyperparameter Grids
    models_config = {
        'SVR': {
            'estimator': Pipeline([('scaler', StandardScaler()), ('svr', SVR(kernel='rbf'))]),
            'param_grid': {
                'svr__C': [0.1, 1.0, 10.0, 50.0, 100.0],
                'svr__epsilon': [0.01, 0.1, 0.5, 1.0],
                'svr__gamma': ['scale', 'auto', 0.01, 0.1]
            }
        },
        'Random Forest': {
            'estimator': RandomForestRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [3, 5, 8, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
        },
        'XGBoost': {
            'estimator': XGBRegressor(random_state=42, eval_metric='rmse'),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 1.0]
            }
        },
        'Gradient Boosting': {
            'estimator': GradientBoostingRegressor(random_state=42),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 1.0]
            }
        }
    }
    
    results = {}
    fitted_best_models = {}
    test_predictions = {}
    
    print("\nStarting Cross-Validation & Model Training...")
    
    for name, config in models_config.items():
        print(f"\n--- Tuning {name} ---", flush=True)
        grid_search = GridSearchCV(
            estimator=config['estimator'],
            param_grid=config['param_grid'],
            cv=tscv,
            scoring='neg_root_mean_squared_error',
            n_jobs=2
        )
        grid_search.fit(X_train, y_train)
        
        best_model = grid_search.best_estimator_
        fitted_best_models[name] = best_model
        
        # Predict on untouched Test Set
        y_pred = best_model.predict(X_test)
        test_predictions[name] = y_pred
        
        # Calculate Test Metrics
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        results[name] = {
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2,
            'best_params': grid_search.best_params_
        }
        
        print(f"{name} Test Set Evaluation:", flush=True)
        print(f"  MAE:  {mae:.4f}", flush=True)
        print(f"  RMSE: {rmse:.4f}", flush=True)
        print(f"  R2:   {r2:.4f}", flush=True)
        print(f"  Best Params: {grid_search.best_params_}", flush=True)
        
    # 4. Selection of Best Model
    # Primary criterion: Lowest RMSE, Secondary: Lowest MAE, Tertiary: Highest R2
    sorted_models = sorted(
        results.items(),
        key=lambda item: (item[1]['RMSE'], item[1]['MAE'], -item[1]['R2'])
    )
    
    best_model_name, best_model_metrics = sorted_models[0]
    best_model_obj = fitted_best_models[best_model_name]
    
    print(f"\n==========================================")
    print(f"BEST MODEL SELECTED: {best_model_name}")
    print(f"Selection Basis: Lowest Test RMSE ({best_model_metrics['RMSE']:.4f}), Lowest Test MAE ({best_model_metrics['MAE']:.4f}), Highest Test R2 ({best_model_metrics['R2']:.4f})")
    print(f"==========================================")
    
    # 5. Save Winning Model and Metadata
    best_model_path = os.path.join(models_dir, "best_honey_yield_model.joblib")
    joblib.dump(best_model_obj, best_model_path)
    print(f"\nSaved best model to: {best_model_path}")
    
    # Clean best params for JSON serialization (convert any numpy / non-serializable objects)
    serializable_params = {}
    for k, v in best_model_metrics['best_params'].items():
        if isinstance(v, (np.integer, np.int64)):
            serializable_params[k] = int(v)
        elif isinstance(v, (np.floating, np.float64)):
            serializable_params[k] = float(v)
        else:
            serializable_params[k] = v

    metadata = {
        "best_model_name": best_model_name,
        "metrics": {
            "MAE": round(best_model_metrics['MAE'], 4),
            "RMSE": round(best_model_metrics['RMSE'], 4),
            "R2": round(best_model_metrics['R2'], 4)
        },
        "best_hyperparameters": serializable_params,
        "feature_columns": feature_cols,
        "target_column": target_col,
        "train_date_range": [train_start_str, train_end_str],
        "test_date_range": [test_start_str, test_end_str],
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
    print(f"Saved metadata to: {metadata_path}")
    
    # 6. Generate Visualizations
    
    # Plot 1: Actual vs Predicted Scatter Plot (Best Model)
    plt.figure(figsize=(8, 6))
    plt.scatter(y_test, test_predictions[best_model_name], color='#2b5c8f', alpha=0.8, edgecolors='k', s=60, label=f'Predictions ({best_model_name})')
    min_val = min(y_test.min(), min(test_predictions[best_model_name]))
    max_val = max(y_test.max(), max(test_predictions[best_model_name]))
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2, label='Ideal 1:1 Line')
    plt.xlabel('Actual Honey Weight (kg)', fontsize=12, fontweight='bold')
    plt.ylabel('Predicted Honey Weight (kg)', fontsize=12, fontweight='bold')
    plt.title(f'Actual vs Predicted Honey Yield ({best_model_name})\nTest Period: Oct 19 - Dec 31, 2024', fontsize=13, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    scatter_plot_path = os.path.join(plots_dir, "actual_vs_predicted.png")
    plt.savefig(scatter_plot_path, dpi=300)
    plt.close()
    print(f"Saved scatter plot to: {scatter_plot_path}")
    
    # Plot 2: Timeline of Actual vs Predicted over Test Dates
    plt.figure(figsize=(12, 6))
    plt.plot(dates_test, y_test, 'o-', color='#1f77b4', linewidth=2, label='Actual Honey Weight (kg)')
    plt.plot(dates_test, test_predictions[best_model_name], 's--', color='#ff7f0e', linewidth=2, label=f'Predicted ({best_model_name})')
    plt.xlabel('Date (Test Period)', fontsize=12, fontweight='bold')
    plt.ylabel('Honey Weight (kg)', fontsize=12, fontweight='bold')
    plt.title(f'Honey Yield Prediction Over Test Period (Chronological)\n({test_start_str} to {test_end_str})', fontsize=13, fontweight='bold')
    plt.gcf().autofmt_xdate()
    plt.legend()
    plt.tight_layout()
    timeline_plot_path = os.path.join(plots_dir, "test_timeline.png")
    plt.savefig(timeline_plot_path, dpi=300)
    plt.close()
    print(f"Saved timeline plot to: {timeline_plot_path}")
    
    # Plot 3: Model Comparison Bar Plot
    model_names = list(results.keys())
    maes = [results[m]['MAE'] for m in model_names]
    rmses = [results[m]['RMSE'] for m in model_names]
    
    x = np.arange(len(model_names))
    width = 0.35
    
    plt.figure(figsize=(10, 6))
    plt.bar(x - width/2, rmses, width, label='RMSE (lower is better)', color='#d95f02')
    plt.bar(x + width/2, maes, width, label='MAE (lower is better)', color='#7570b3')
    
    plt.xlabel('Model', fontsize=12, fontweight='bold')
    plt.ylabel('Error (kg)', fontsize=12, fontweight='bold')
    plt.title('Model Error Comparison on Test Set (Chronological 20%)', fontsize=13, fontweight='bold')
    plt.xticks(x, model_names, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    comparison_plot_path = os.path.join(plots_dir, "model_comparison.png")
    plt.savefig(comparison_plot_path, dpi=300)
    plt.close()
    print(f"Saved model comparison plot to: {comparison_plot_path}")
    
    # Print Comparison Table
    print("\n==========================================")
    print("FINAL MODEL COMPARISON TABLE (TEST SET)")
    print("==========================================")
    print(f"{'Model':<20} | {'MAE (kg)':<10} | {'RMSE (kg)':<10} | {'R² Score':<10}")
    print("-" * 58)
    for m in model_names:
        print(f"{m:<20} | {results[m]['MAE']:<10.4f} | {results[m]['RMSE']:<10.4f} | {results[m]['R2']:<10.4f}")

if __name__ == "__main__":
    main()
