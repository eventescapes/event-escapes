#!/bin/bash

# Event Escapes - Ultimate Test: Round Trip with Seats & Baggage
# This script completes everything within the offer expiration window

set -e  # Exit on error

echo "🚀 Starting Ultimate Test: LAX ↔ JFK Round Trip"
echo "================================================"
echo ""

# Configuration
SUPABASE_URL="https://jxrrhsqffnzeljszbecg.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3NTQyNTMsImV4cCI6MjA0NDMzMDI1M30.HpvjsMmQTN-vN0i-BtmS_TyDdYs_EyH1p5rB1iHnkE8"

# Test passengers
PASSENGERS='[
  {
    "type": "adult",
    "title": "mr",
    "given_name": "John",
    "family_name": "Smith",
    "gender": "m",
    "born_on": "1985-03-15",
    "email": "test@eventescapes.com",
    "phone_number": "+61412345678"
  },
  {
    "type": "adult",
    "title": "ms",
    "given_name": "Jane",
    "family_name": "Smith",
    "gender": "f",
    "born_on": "1987-07-20",
    "email": "test@eventescapes.com",
    "phone_number": "+61412345678"
  },
  {
    "type": "adult",
    "title": "mr",
    "given_name": "Bob",
    "family_name": "Smith",
    "gender": "m",
    "born_on": "1990-12-10",
    "email": "test@eventescapes.com",
    "phone_number": "+61412345678"
  }
]'

echo "📅 Step 1: Searching for round-trip flights..."
echo "   Route: LAX ↔ JFK"
echo "   Dates: 2026-06-15 to 2026-06-20"
echo "   Passengers: 3 adults"
echo "   Max Results: 5"
echo ""

SEARCH_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/duffel_search" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LAX",
    "destination": "JFK",
    "departure_date": "2026-06-15",
    "return_date": "2026-06-20",
    "cabin": "economy",
    "adults": 3,
    "children": 0,
    "infants": 0,
    "max_connections": 1,
    "max_results": 5
  }')

# Check if search was successful
if ! echo "$SEARCH_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "❌ Search failed!"
  echo "$SEARCH_RESPONSE" | jq '.'
  exit 1
fi

# Extract offer data
OFFER_ID=$(echo "$SEARCH_RESPONSE" | jq -r '.offers[0].id')
BASE_AMOUNT=$(echo "$SEARCH_RESPONSE" | jq -r '.offers[0].total_amount')
CURRENCY=$(echo "$SEARCH_RESPONSE" | jq -r '.offers[0].total_currency')

# Extract passenger IDs from offer
PASSENGER_IDS=$(echo "$SEARCH_RESPONSE" | jq -r '.offers[0].passengers | map(.id)')

echo "✅ Search complete!"
echo "   Offer ID: $OFFER_ID"
echo "   Base Price: $BASE_AMOUNT $CURRENCY"
echo "   Passenger IDs: $(echo $PASSENGER_IDS | jq -c '.')"
echo ""

# Wait 2 seconds
sleep 2

echo "🪑 Step 2: Getting seat maps for both flights..."
echo ""

SEAT_MAPS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/duffel_seat_maps" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"offer_id\": \"$OFFER_ID\"}")

# Check if seat maps request was successful
if ! echo "$SEAT_MAPS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "❌ Seat maps request failed!"
  echo "$SEAT_MAPS_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Seat maps retrieved!"
echo "   Number of seat maps: $(echo "$SEAT_MAPS_RESPONSE" | jq '.seat_maps | length')"
echo ""

# Save full seat maps to file for reference
echo "$SEAT_MAPS_RESPONSE" | jq '.' > ultimate_test_seat_maps.json

# Wait 2 seconds
sleep 2

echo "🧳 Step 3: Getting baggage services..."
echo ""

BAGGAGE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/duffel_offer_services" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"offer_id\": \"$OFFER_ID\"}")

# Check if baggage request was successful
if ! echo "$BAGGAGE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "❌ Baggage services request failed!"
  echo "$BAGGAGE_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Baggage services retrieved!"
echo "   Available baggage options: $(echo "$BAGGAGE_RESPONSE" | jq '.available_services.baggage | length')"
echo ""

# Save baggage data to file
echo "$BAGGAGE_RESPONSE" | jq '.' > ultimate_test_baggage.json

# Wait 2 seconds
sleep 2

echo "🔍 Step 4: Extracting seat service IDs..."
echo "   Looking for seats 30H, 30J, 30K on both flights..."
echo ""

# Create Python script to extract services
cat > extract_services.py << 'PYTHON_SCRIPT'
import json
import sys

# Load seat maps
with open('ultimate_test_seat_maps.json', 'r') as f:
    seat_data = json.load(f)

# Load baggage
with open('ultimate_test_baggage.json', 'r') as f:
    baggage_data = json.load(f)

# Load passenger IDs from command line
passenger_ids = json.loads(sys.argv[1])

services = []

# Extract seat services
seat_maps = seat_data.get('seat_maps', [])

print(f"📊 Found {len(seat_maps)} seat maps")
print("")

for flight_idx, seat_map in enumerate(seat_maps):
    print(f"Flight {flight_idx + 1}:")
    print(f"  Segment ID: {seat_map['segment_id']}")

    # Find seats 30H, 30J, 30K
    target_seats = ['30H', '30J', '30K']

    for cabin in seat_map.get('cabins', []):
        for row in cabin.get('rows', []):
            for section in row.get('sections', []):
                for element in section.get('elements', []):
                    if element.get('type') == 'seat':
                        designator = element.get('designator', '')

                        if designator in target_seats:
                            passenger_idx = target_seats.index(designator)

                            seat_services = element.get('services', [])
                            if len(seat_services) > passenger_idx:
                                service = seat_services[passenger_idx]
                                services.append({
                                    'id': service['id'],
                                    'type': 'seat',
                                    'amount': float(service['total_amount']),
                                    'quantity': 1
                                })
                                print(f"  ✅ Passenger {passenger_idx + 1} → Seat {designator} → {service['id']} (${service['total_amount']})")

print("")
print(f"✅ Extracted {len(services)} seat services")
print("")

# Extract baggage services (2 passengers want extra bags)
baggage_services = baggage_data.get('available_services', {}).get('baggage', [])

if len(baggage_services) >= 2:
    print("🧳 Adding baggage services for 2 passengers:")
    for i in range(2):
        bag = baggage_services[i]
        services.append({
            'id': bag['id'],
            'type': 'baggage',
            'amount': float(bag['total_amount']),
            'quantity': 1
        })
        print(f"  ✅ Passenger {i + 1} → Extra bag → {bag['id']} (${bag['total_amount']})")
    print("")

# Merge passenger IDs with passenger data
passengers_with_ids = json.loads(sys.argv[2])
for i, passenger in enumerate(passengers_with_ids):
    if i < len(passenger_ids):
        passenger['id'] = passenger_ids[i]

# Calculate total
base_amount = float(sys.argv[3])
services_total = sum(s['amount'] * s['quantity'] for s in services)
total_amount = round(base_amount + services_total, 2)

print("💰 Pricing Breakdown:")
print(f"  Base Flight: ${base_amount}")
print(f"  Services:    ${services_total:.2f}")
print(f"  TOTAL:       ${total_amount:.2f}")
print("")

# Output JSON for checkout
output = {
    'offerId': sys.argv[4],
    'passengers': passengers_with_ids,
    'services': services,
    'totalAmount': total_amount,
    'currency': sys.argv[5]
}

with open('ultimate_test_checkout_request.json', 'w') as f:
    json.dump(output, f, indent=2)

print("✅ Checkout request saved to: ultimate_test_checkout_request.json")
PYTHON_SCRIPT

# Run Python script
python3 extract_services.py \
  "$PASSENGER_IDS" \
  "$PASSENGERS" \
  "$BASE_AMOUNT" \
  "$OFFER_ID" \
  "$CURRENCY"

echo ""

# Wait 2 seconds
sleep 2

echo "💳 Step 5: Creating checkout session..."
echo ""

CHECKOUT_REQUEST=$(cat ultimate_test_checkout_request.json)

CHECKOUT_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/create-checkout-session" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$CHECKOUT_REQUEST")

# Check if checkout was successful
if echo "$CHECKOUT_RESPONSE" | jq -e '.url' > /dev/null 2>&1; then
  CHECKOUT_URL=$(echo "$CHECKOUT_RESPONSE" | jq -r '.url')
  SESSION_ID=$(echo "$CHECKOUT_RESPONSE" | jq -r '.sessionId')

  echo "✅ Checkout session created!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 SUCCESS! Ready for payment!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 Booking Details:"
  echo "   Offer ID: $OFFER_ID"
  echo "   Session ID: $SESSION_ID"
  echo ""
  echo "🔗 Checkout URL:"
  echo "   $CHECKOUT_URL"
  echo ""
  echo "💳 Test Card:"
  echo "   Card Number: 4242 4242 4242 4242"
  echo "   Expiry: Any future date"
  echo "   CVC: Any 3 digits"
  echo ""
  echo "📁 Files Created:"
  echo "   - ultimate_test_seat_maps.json"
  echo "   - ultimate_test_baggage.json"
  echo "   - ultimate_test_checkout_request.json"
  echo ""
  echo "⏱️  Total Time: ~15 seconds (well within expiration window!)"
  echo ""
  echo "Next: Open the checkout URL and complete payment!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Save checkout response
  echo "$CHECKOUT_RESPONSE" | jq '.' > ultimate_test_checkout_response.json

else
  echo "❌ Checkout creation failed!"
  echo "$CHECKOUT_RESPONSE" | jq '.'
  exit 1
fi