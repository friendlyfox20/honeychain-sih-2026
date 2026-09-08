import httpx

requests = httpx


BASE_URL = "http://127.0.0.1:8000/api/v1"

def login(email, password="password123"):
    res = requests.post(f"{BASE_URL}/auth/login/json", json={"email": email, "password": password})
    res.raise_for_status()
    return res.json()["access_token"]

def seed_demo_batch():
    # 1. Login as Beekeeper
    beekeeper_token = login("beekeeper@honeychain.com")
    bk_headers = {"Authorization": f"Bearer {beekeeper_token}"}
    
    batch_id = "BATCH-2026-0001"
    
    # Check if batch exists
    check_res = requests.get(f"{BASE_URL}/batches/{batch_id}", headers=bk_headers)
    if check_res.status_code == 200:
        print(f"Batch {batch_id} already exists.")
        return
        
    # Create batch
    batch_payload = {
        "batch_id": batch_id,
        "source_type": "HIVE",
        "source_reference": "HIVE-MAH-042",
        "quantity_kg": 50.0
    }
    b_res = requests.post(f"{BASE_URL}/batches", json=batch_payload, headers=bk_headers)
    b_res.raise_for_status()
    print(f"Created batch {batch_id}")
    
    # Add Harvest event
    requests.post(f"{BASE_URL}/batches/{batch_id}/events", json={
        "event_type": "HARVEST",
        "location": "Mahabaleshwar Apiary Zone 4",
        "quantity_kg": 50.0,
        "notes": "Raw multi-flora honey harvested in pristine mountain weather."
    }, headers=bk_headers).raise_for_status()
    print("Added HARVEST event")
    
    # Login as Collector
    collector_token = login("collector@honeychain.com")
    cl_headers = {"Authorization": f"Bearer {collector_token}"}
    
    # Add Collection event
    requests.post(f"{BASE_URL}/batches/{batch_id}/events", json={
        "event_type": "COLLECTION",
        "location": "Satara Collection Hub",
        "quantity_kg": 50.0,
        "notes": "Collected in food-grade sealed stainless steel tanks."
    }, headers=cl_headers).raise_for_status()
    print("Added COLLECTION event")
    
    # Login as Processor
    processor_token = login("processor@honeychain.com")
    pr_headers = {"Authorization": f"Bearer {processor_token}"}
    
    # Add Processing event
    requests.post(f"{BASE_URL}/batches/{batch_id}/events", json={
        "event_type": "PROCESSING",
        "location": "Pune Organic Processing Unit",
        "quantity_kg": 48.5,
        "notes": "Gentle micro-filtration and moisture reduction under 40°C."
    }, headers=pr_headers).raise_for_status()
    print("Added PROCESSING event")
    
    # Add Packaging event
    requests.post(f"{BASE_URL}/batches/{batch_id}/events", json={
        "event_type": "PACKAGING",
        "location": "Pune Organic Packaging Facility",
        "quantity_kg": 48.0,
        "notes": "Bottled in 500g amber glass jars."
    }, headers=pr_headers).raise_for_status()
    print("Added PACKAGING event")
    
    # Run Mass Conservation Reconciliation
    requests.post(f"{BASE_URL}/batches/{batch_id}/reconcile", json={
        "input_quantity_kg": 50.0,
        "output_quantity_kg": 48.0
    }, headers=pr_headers).raise_for_status()
    print("Reconciliation complete (PASS)")
    
    # Login as Lab
    lab_token = login("lab@honeychain.com")
    lab_headers = {"Authorization": f"Bearer {lab_token}"}
    
    # Add Lab Record
    requests.post(f"{BASE_URL}/batches/{batch_id}/lab", json={
        "test_name": "Purity & Fructose-Glucose Ratio Analysis",
        "test_result": "Moisture: 17.8%, F/G Ratio: 1.14, C4 Sugar: Absent, Hydroxymethylfurfural (HMF): 12 mg/kg",
        "status": "PASSED",
        "laboratory_name": "Apex Food & Agrochemical Testing Lab",
        "notes": "Conforms fully to national raw honey standards."
    }, headers=lab_headers).raise_for_status()
    print("Added Lab Record")
    
    # Add Evidence
    requests.post(f"{BASE_URL}/batches/{batch_id}/evidence", json={
        "evidence_type": "CERTIFICATE",
        "file_reference": "certificates/APEX-LAB-2026-0891.pdf",
        "description": "Authentic laboratory certificate of analysis and chromatography assay."
    }, headers=lab_headers).raise_for_status()
    print("Added Evidence")
    
    # Anchor to Blockchain
    requests.post(f"{BASE_URL}/batches/{batch_id}/blockchain/anchor", json={
        "record_type": "BATCH_LIFECYCLE_FINAL"
    }, headers=pr_headers).raise_for_status()
    print("Blockchain integrity anchored")
    
    # Generate QR code
    qr_res = requests.post(f"{BASE_URL}/batches/{batch_id}/qr", headers=pr_headers)
    qr_res.raise_for_status()
    print("QR Code generated successfully:", qr_res.json()["verification_url"])
    
if __name__ == "__main__":
    seed_demo_batch()
