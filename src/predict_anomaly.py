import os
import sys
import joblib
import pandas as pd
import numpy as np
import argparse

def load_anomaly_model(model_path=os.path.join("models", "best_anomaly_model.joblib")):
    """
    Loads the trained best anomaly classification model.
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Anomaly model not found at: {model_path}. Please run train_anomaly_models.py first.")
    return joblib.load(model_path)

def analyze_supply_chain_batch(batch_id, harvest, processing, bottled, dispatched, model_path=os.path.join("models", "best_anomaly_model.joblib")):
    """
    Performs a 2-layer anomaly detection and explanation analysis on a supply chain batch.
    
    Parameters:
    - batch_id (str): Batch Identifier
    - harvest (float): Harvested Quantity (kg)
    - processing (float): Processed Quantity (kg)
    - bottled (float): Bottled Quantity (kg)
    - dispatched (float): Dispatched Quantity (kg)
    
    Returns:
    - dict: Detailed analysis result including rule violations, ML predictions, gaps, and final decision.
    """
    # Input Validation
    if not batch_id or not str(batch_id).strip():
        raise ValueError("Batch ID cannot be empty.")
    if harvest < 0 or processing < 0 or bottled < 0 or dispatched < 0:
        raise ValueError("Quantity values cannot be negative.")
        
    harvest = float(harvest)
    processing = float(processing)
    bottled = float(bottled)
    dispatched = float(dispatched)
    
    # Calculate Gaps
    processing_gap = processing - harvest
    bottling_gap = bottled - processing
    dispatch_gap = dispatched - bottled
    
    # --- LAYER 1: Deterministic Mass-Conservation Rules ---
    violations = []
    
    if processing > harvest:
        excess = processing - harvest
        violations.append({
            'rule': 'Processing <= Harvest',
            'description': 'Processing quantity exceeds harvested quantity (possible volume injection / adulteration)',
            'excess_kg': excess
        })
        
    if bottled > processing:
        excess = bottled - processing
        violations.append({
            'rule': 'Bottled <= Processing',
            'description': 'Bottled quantity exceeds processed quantity (possible batch dilution / label fraud)',
            'excess_kg': excess
        })
        
    if dispatched > bottled:
        excess = dispatched - bottled
        violations.append({
            'rule': 'Dispatched <= Bottled',
            'description': 'Dispatched quantity exceeds bottled quantity (possible inventory inflation / ghost shipment)',
            'excess_kg': excess
        })
        
    rule_anomaly = 1 if len(violations) > 0 else 0
    rule_status = "FAIL" if rule_anomaly == 1 else "PASS"
    
    # --- LAYER 2: ML Model Prediction ---
    model = load_anomaly_model(model_path=model_path)
    
    feature_names = ['Harvest_Quantity_kg', 'Processing_Quantity_kg', 'Bottled_Quantity_kg', 'Dispatched_Quantity_kg']
    input_df = pd.DataFrame([{
        'Harvest_Quantity_kg': harvest,
        'Processing_Quantity_kg': processing,
        'Bottled_Quantity_kg': bottled,
        'Dispatched_Quantity_kg': dispatched
    }])[feature_names]
    
    ml_pred = model.predict(input_df)[0]
    ml_anomaly = int(ml_pred)
    ml_status = "ANOMALY" if ml_anomaly == 1 else "NORMAL"
    
    confidence_info = None
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(input_df)[0]
            confidence_info = f"Anomaly Probability: {probs[1]*100:.2f}% (Normal: {probs[0]*100:.2f}%)"
        except Exception:
            pass
    elif hasattr(model, "decision_function"):
        try:
            score = model.decision_function(input_df)[0]
            confidence_info = f"Decision Score: {score:.4f}"
        except Exception:
            pass

    # --- FINAL COMBINED DECISION ---
    final_anomaly = 1 if (rule_anomaly == 1 or ml_anomaly == 1) else 0
    final_status = "ANOMALY" if final_anomaly == 1 else "NORMAL"
    
    return {
        'batch_id': batch_id,
        'quantities': {
            'harvest': harvest,
            'processing': processing,
            'bottled': bottled,
            'dispatched': dispatched
        },
        'gaps': {
            'processing_gap': processing_gap,
            'bottling_gap': bottling_gap,
            'dispatch_gap': dispatch_gap
        },
        'layer1_rule_check': {
            'status': rule_status,
            'rule_anomaly': rule_anomaly,
            'violations': violations
        },
        'layer2_ml_prediction': {
            'status': ml_status,
            'ml_anomaly': ml_anomaly,
            'confidence_info': confidence_info
        },
        'final_decision': {
            'status': final_status,
            'final_anomaly': final_anomaly
        }
    }

def print_batch_report(res):
    """
    Prints a clear, human-readable report for a analyzed supply chain batch.
    """
    q = res['quantities']
    g = res['gaps']
    l1 = res['layer1_rule_check']
    l2 = res['layer2_ml_prediction']
    fin = res['final_decision']
    
    print("\n==========================================")
    print(f"Batch: {res['batch_id']}")
    print("==========================================")
    print(f"Harvest:       {q['harvest']:>10.2f} kg")
    print(f"Processing:    {q['processing']:>10.2f} kg  (Gap: {g['processing_gap']:+.2f} kg)")
    print(f"Bottled:       {q['bottled']:>10.2f} kg  (Gap: {g['bottling_gap']:+.2f} kg)")
    print(f"Dispatched:    {q['dispatched']:>10.2f} kg  (Gap: {g['dispatch_gap']:+.2f} kg)")
    print("------------------------------------------")
    print(f"Rule Check:    {l1['status']}")
    
    if l1['status'] == 'FAIL':
        print("\nViolations:")
        for v in l1['violations']:
            print(f"  - {v['description']}")
            print(f"    Excess quantity: {v['excess_kg']:.2f} kg")
            
    print(f"\nML Prediction: {l2['status']}")
    if l2['confidence_info']:
        print(f"  ({l2['confidence_info']})")
        
    print("------------------------------------------")
    print(f"Final Status:  {fin['status']}")
    print("==========================================")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Supply-Chain Anomaly Prediction and Explanation Layer.")
    parser.add_argument("--batch-id", type=str, default="HC-BATCH-DEMO", help="Batch Identifier (e.g. HC-BATCH-1001)")
    parser.add_argument("--harvest", type=float, required=True, help="Harvested quantity (kg)")
    parser.add_argument("--processing", type=float, required=True, help="Processing quantity (kg)")
    parser.add_argument("--bottled", type=float, required=True, help="Bottled quantity (kg)")
    parser.add_argument("--dispatched", type=float, required=True, help="Dispatched quantity (kg)")
    
    args = parser.parse_args()
    
    try:
        res = analyze_supply_chain_batch(
            batch_id=args.batch_id,
            harvest=args.harvest,
            processing=args.processing,
            bottled=args.bottled,
            dispatched=args.dispatched
        )
        print_batch_report(res)
    except Exception as e:
        print(f"\n[INPUT ERROR]: {e}", file=sys.stderr)
        sys.exit(1)
