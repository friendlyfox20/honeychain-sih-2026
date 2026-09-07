import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
from sklearn.pipeline import Pipeline

def main():
    sns.set_theme(style="whitegrid")
    
    # Paths
    csv_path = os.path.join("anomaly_data", "supply_chain_demo.csv")
    models_dir = "models"
    out_dir = os.path.join("results", "anomaly_detection")
    plots_dir = os.path.join(out_dir, "plots")
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)
    
    print("==========================================")
    print("SUPPLY-CHAIN ANOMALY CLASSIFICATION PIPELINE")
    print("==========================================")
    print("Dataset Type: SIMULATED / DEMO DATASET for Honey Chain Supply-Chain Verification")
    
    # 1. Load Dataset
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}. Please generate anomaly_data/supply_chain_demo.csv first.")
        
    df = pd.read_csv(csv_path)
    
    feature_cols = [
        'Harvest_Quantity_kg',
        'Processing_Quantity_kg',
        'Bottled_Quantity_kg',
        'Dispatched_Quantity_kg'
    ]
    target_col = 'Anomaly'
    
    X = df[feature_cols]
    y = df[target_col]
    
    total_records = len(df)
    n_normal = int((y == 0).sum())
    n_anomaly = int((y == 1).sum())
    anomaly_pct = (n_anomaly / total_records) * 100.0
    
    print(f"\nDataset Statistics:")
    print(f"  Total Records:   {total_records}")
    print(f"  Normal Records:  {n_normal} (0)")
    print(f"  Anomaly Records: {n_anomaly} (1)")
    print(f"  Anomaly Ratio:   {anomaly_pct:.2f}%")
    
    # 2. Stratified Train/Test Split (80% Train, 20% Test)
    RANDOM_SEED = 42
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        stratify=y,
        random_state=RANDOM_SEED
    )
    
    print(f"\nStratified Split (Seed = {RANDOM_SEED}):")
    print(f"  Train Set: {len(X_train)} samples (Anomalies: {int((y_train==1).sum())})")
    print(f"  Test Set:  {len(X_test)} samples (Anomalies: {int((y_test==1).sum())})")
    
    # 3. Model Configurations & Hyperparameter Grids
    cv_stratified = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    
    models_config = {
        'SVM / SVC': {
            'estimator': Pipeline([('scaler', StandardScaler()), ('svc', SVC(random_state=RANDOM_SEED, probability=True))]),
            'param_grid': {
                'svc__C': [0.1, 1.0, 10.0, 100.0],
                'svc__kernel': ['rbf', 'linear'],
                'svc__gamma': ['scale', 'auto']
            }
        },
        'Random Forest': {
            'estimator': RandomForestClassifier(random_state=RANDOM_SEED, class_weight='balanced'),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [3, 5, 8, None],
                'min_samples_split': [2, 5, 10]
            }
        },
        'Gradient Boosting': {
            'estimator': GradientBoostingClassifier(random_state=RANDOM_SEED),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1]
            }
        },
        'XGBoost': {
            'estimator': XGBClassifier(random_state=RANDOM_SEED, eval_metric='logloss'),
            'param_grid': {
                'n_estimators': [50, 100, 150],
                'max_depth': [2, 3, 5],
                'learning_rate': [0.01, 0.05, 0.1],
                'scale_pos_weight': [1, 5, 10]
            }
        }
    }
    
    results = []
    fitted_best_models = {}
    confusion_matrices = {}
    
    print("\nStarting Stratified Cross-Validation & Model Training...", flush=True)
    
    for name, config in models_config.items():
        grid = GridSearchCV(
            estimator=config['estimator'],
            param_grid=config['param_grid'],
            cv=cv_stratified,
            scoring='f1',
            n_jobs=2
        )
        grid.fit(X_train, y_train)
        
        best_model = grid.best_estimator_
        fitted_best_models[name] = best_model
        
        y_pred = best_model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, pos_label=1, zero_division=0)
        rec = recall_score(y_test, y_pred, pos_label=1, zero_division=0)
        f1 = f1_score(y_test, y_pred, pos_label=1, zero_division=0)
        cm = confusion_matrix(y_test, y_pred)
        confusion_matrices[name] = cm
        
        results.append({
            'Model': name,
            'Accuracy': acc,
            'Precision': prec,
            'Recall': rec,
            'F1-Score': f1,
            'best_params': grid.best_params_
        })
        
        print(f"\n--- {name} Evaluation (Test Set) ---", flush=True)
        print(f"  Accuracy:        {acc:.4f}", flush=True)
        print(f"  Precision (Anom):{prec:.4f}", flush=True)
        print(f"  Recall (Anom):   {rec:.4f}", flush=True)
        print(f"  F1-Score (Anom): {f1:.4f}", flush=True)
        print(f"  Best Params:     {grid.best_params_}", flush=True)
        print("  Classification Report:")
        print(classification_report(y_test, y_pred, target_names=['Normal (0)', 'Anomaly (1)'], digits=4))

    # 4. Model Selection (Primary Basis: F1-Score of Anomaly class, Secondary: Recall of Anomaly class)
    sorted_results = sorted(
        results,
        key=lambda x: (x['F1-Score'], x['Recall'], x['Accuracy']),
        reverse=True
    )
    best_model_info = sorted_results[0]
    best_model_name = best_model_info['Model']
    best_model_obj = fitted_best_models[best_model_name]
    
    print("\n==========================================")
    print(f"WINNING MODEL SELECTED: {best_model_name}")
    print(f"Selection Basis: Highest Anomaly F1-Score ({best_model_info['F1-Score']:.4f}) & Anomaly Recall ({best_model_info['Recall']:.4f})")
    print("==========================================")
    
    # 5. Save Best Model & Metadata
    model_save_path = os.path.join(models_dir, "best_anomaly_model.joblib")
    joblib.dump(best_model_obj, model_save_path)
    print(f"Saved best anomaly model to: {model_save_path}")
    
    serializable_params = {}
    for k, v in best_model_info['best_params'].items():
        if isinstance(v, (np.integer, np.int64)):
            serializable_params[k] = int(v)
        elif isinstance(v, (np.floating, np.float64)):
            serializable_params[k] = float(v)
        else:
            serializable_params[k] = v

    meta_results = []
    for r in results:
        meta_results.append({
            'Model': r['Model'],
            'Accuracy': round(r['Accuracy'], 4),
            'Precision': round(r['Precision'], 4),
            'Recall': round(r['Recall'], 4),
            'F1-Score': round(r['F1-Score'], 4)
        })

    metadata = {
        "dataset_type": "SIMULATED_DEMO_DATASET",
        "dataset_path": csv_path,
        "total_records": total_records,
        "normal_records": n_normal,
        "anomaly_records": n_anomaly,
        "anomaly_ratio_pct": round(anomaly_pct, 2),
        "feature_columns": feature_cols,
        "target_column": target_col,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "random_seed": RANDOM_SEED,
        "preprocessing_details": "StandardScaler applied for SVM/SVC; Tree models trained on raw quantity features.",
        "best_model_name": best_model_name,
        "best_hyperparameters": serializable_params,
        "selection_rationale": "Prioritized Anomaly-Class F1-Score and Recall to minimize missed supply chain anomalies.",
        "model_comparison_metrics": meta_results
    }
    
    metadata_save_path = os.path.join(out_dir, "anomaly_model_metadata.json")
    with open(metadata_save_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"Saved metadata to: {metadata_save_path}")
    
    # 6. Generate Plots
    
    # Plot 1: Model Comparison Bar Plot (Precision, Recall, F1, Accuracy)
    plt.figure(figsize=(10, 6))
    res_df = pd.DataFrame(results)
    
    x = np.arange(len(res_df))
    width = 0.2
    
    plt.bar(x - 1.5*width, res_df['Recall'], width, label='Recall (Anomaly)', color='#d95f02')
    plt.bar(x - 0.5*width, res_df['F1-Score'], width, label='F1-Score (Anomaly)', color='#7570b3')
    plt.bar(x + 0.5*width, res_df['Precision'], width, label='Precision (Anomaly)', color='#1b9e77')
    plt.bar(x + 1.5*width, res_df['Accuracy'], width, label='Overall Accuracy', color='#e7298a')
    
    plt.xlabel('Model', fontsize=11, fontweight='bold')
    plt.ylabel('Score (0.0 to 1.0)', fontsize=11, fontweight='bold')
    plt.title('Supply Chain Anomaly Classification Performance Comparison', fontsize=12, fontweight='bold')
    plt.xticks(x, res_df['Model'], fontweight='bold')
    plt.ylim(0, 1.08)
    plt.legend(loc='lower right')
    plt.tight_layout()
    comparison_plot_path = os.path.join(plots_dir, "model_comparison.png")
    plt.savefig(comparison_plot_path, dpi=300)
    plt.close()
    print(f"Saved comparison plot to: {comparison_plot_path}")
    
    # Plot 2: Confusion Matrix for Best Model (and 2x2 grid for all models)
    fig, axes = plt.subplots(2, 2, figsize=(10, 8))
    axes = axes.flatten()
    
    for idx, (m_name, cm) in enumerate(confusion_matrices.items()):
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[idx], cbar=False,
                    xticklabels=['Normal', 'Anomaly'], yticklabels=['Normal', 'Anomaly'])
        axes[idx].set_title(f'{m_name}', fontsize=11, fontweight='bold')
        axes[idx].set_xlabel('Predicted Label')
        axes[idx].set_ylabel('True Label')
        
    plt.suptitle(f'Confusion Matrices for Supply Chain Anomaly Classifiers\n(Best Model: {best_model_name})', fontsize=13, fontweight='bold')
    plt.tight_layout()
    cm_plot_path = os.path.join(plots_dir, "confusion_matrix.png")
    plt.savefig(cm_plot_path, dpi=300)
    plt.close()
    print(f"Saved confusion matrix grid to: {cm_plot_path}")

    # 7. Final Report Output
    print("\n==========================================")
    print("FINAL ANOMALY CLASSIFICATION SUMMARY REPORT")
    print("==========================================")
    print(f"Dataset Used:        {csv_path} (SIMULATED DEMO DATA)")
    print(f"Total Records Used:  {total_records} (Train: {len(X_train)}, Test: {len(X_test)})")
    print(f"Normal / Anomaly:    Normal = {n_normal}, Anomaly = {n_anomaly} ({anomaly_pct:.2f}% anomalies)")
    print("-" * 65)
    print(f"{'Model':<20} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 65)
    for r in results:
        print(f"{r['Model']:<20} | {r['Accuracy']:<10.4f} | {r['Precision']:<10.4f} | {r['Recall']:<10.4f} | {r['F1-Score']:<10.4f}")
    print("-" * 65)
    print(f"Selected Winner:     {best_model_name}")
    print(f"Selection Rationale: Achieved highest F1-score ({best_model_info['F1-Score']:.4f}) and Recall ({best_model_info['Recall']:.4f}) for the anomaly class.")
    print("==========================================")

if __name__ == "__main__":
    main()
