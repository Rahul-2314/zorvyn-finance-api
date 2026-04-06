#!/bin/bash
# chmod +x test-api.sh && ./test-api.sh

# BASE="http://localhost:5000/api"
BASE="https://zorvyn-finance-api-y298.onrender.com/api"
LINE="─────────────────────────────────────────────"
pass=0
fail=0

check() {
  local label="$1" got="$2" want="$3" body="$4"
  if [ "$got" -eq "$want" ] 2>/dev/null; then
    echo "  ✓  $label"
    pass=$((pass+1))
  else
    echo "  ✗  $label  (expected $want, got $got)"
    [ -n "$body" ] && echo "     body: $(echo "$body" | head -c 120)"
    fail=$((fail+1))
  fi
}

req() { curl -s -w "\n%{http_code}" "$@"; }
body() { echo "$1" | head -1; }
code() { echo "$1" | tail -1; }
field() { echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | head -1 | sed "s/\"$2\":\"//;s/\"//"; }

S=$(date +%s)

echo ""
echo "Finance API — Test Suite"
echo "$LINE"


# ── AUTH ──────────────────────────────────────────────────
echo ""
echo "[ AUTH ]"

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Admin\",\"email\":\"admin$S@t.dev\",\"password\":\"pass123\",\"role\":\"admin\"}")
check "Register admin" "$(code "$R")" 201 "$(body "$R")"
ADMIN_TOKEN=$(field "$(body "$R")" "token")

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Analyst\",\"email\":\"analyst$S@t.dev\",\"password\":\"pass123\",\"role\":\"analyst\"}")
check "Register analyst" "$(code "$R")" 201 "$(body "$R")"
ANALYST_TOKEN=$(field "$(body "$R")" "token")

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Viewer\",\"email\":\"viewer$S@t.dev\",\"password\":\"pass123\",\"role\":\"viewer\"}")
check "Register viewer" "$(code "$R")" 201 "$(body "$R")"
VIEWER_TOKEN=$(field "$(body "$R")" "token")
VIEWER_ID=$(field "$(body "$R")" "_id")

R=$(req -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"admin$S@t.dev\",\"password\":\"pass123\"}")
check "Login correct password" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Dup\",\"email\":\"admin$S@t.dev\",\"password\":\"pass123\"}")
check "Register duplicate email → 409" "$(code "$R")" 409 "$(body "$R")"

R=$(req -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"admin$S@t.dev\",\"password\":\"wrong\"}")
check "Login wrong password → 401" "$(code "$R")" 401 "$(body "$R")"

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"name":"X","email":"notanemail","password":"pass123"}')
check "Register invalid email → 400" "$(code "$R")" 400 "$(body "$R")"

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"name":"X","email":"x@x.com","password":"abc"}')
check "Register short password → 400" "$(code "$R")" 400 "$(body "$R")"


# ── USERS ─────────────────────────────────────────────────
echo ""
echo "[ USERS ]"

R=$(req -X GET "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN")
check "List users (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/users/$VIEWER_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Get user by ID (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/users/000000000000000000000000" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Get non-existent user → 404" "$(code "$R")" 404 "$(body "$R")"

R=$(req -X GET "$BASE/users" -H "Authorization: Bearer $VIEWER_TOKEN")
check "List users (viewer) → 403" "$(code "$R")" 403 "$(body "$R")"

R=$(req -X GET "$BASE/users" -H "Authorization: Bearer $ANALYST_TOKEN")
check "List users (analyst) → 403" "$(code "$R")" 403 "$(body "$R")"

R=$(req -X GET "$BASE/users")
check "List users no token → 401" "$(code "$R")" 401 "$(body "$R")"

R=$(req -X PATCH "$BASE/users/$VIEWER_ID/role" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"role":"analyst"}')
check "Update user role (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X PATCH "$BASE/users/$VIEWER_ID/role" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"role":"superuser"}')
check "Update user invalid role value → 400" "$(code "$R")" 400 "$(body "$R")"

R=$(req -X PATCH "$BASE/users/$VIEWER_ID/status" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"active":false}')
check "Deactivate user (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X PATCH "$BASE/users/$VIEWER_ID/status" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"active":true}')
check "Reactivate user (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X PATCH "$BASE/users/$VIEWER_ID/status" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"active":"yes"}')
check "Update user status invalid value → 400" "$(code "$R")" 400 "$(body "$R")"


# ── RECORDS ───────────────────────────────────────────────
echo ""
echo "[ RECORDS ]"

# Fresh users whose roles are never modified — used only for permission checks
R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"RecViewer\",\"email\":\"rv$S@t.dev\",\"password\":\"pass123\",\"role\":\"viewer\"}")
REC_VIEWER_TOKEN=$(field "$(body "$R")" "token")

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"RecAnalyst\",\"email\":\"ra$S@t.dev\",\"password\":\"pass123\",\"role\":\"analyst\"}")
REC_ANALYST_TOKEN=$(field "$(body "$R")" "token")

R=$(req -X POST "$BASE/records" \
  -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":75000,"type":"income","category":"Salary","date":"2024-05-01","notes":"May salary"}')
check "Create record (analyst)" "$(code "$R")" 201 "$(body "$R")"
RECORD_ID=$(field "$(body "$R")" "_id")

req -X POST "$BASE/records" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":14000,"type":"expense","category":"Rent","date":"2024-05-03"}' > /dev/null

req -X POST "$BASE/records" -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":5500,"type":"expense","category":"Food","date":"2024-05-10"}' > /dev/null

req -X POST "$BASE/records" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":60000,"type":"income","category":"Salary","date":"2024-06-01"}' > /dev/null

req -X POST "$BASE/records" -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":9500,"type":"expense","category":"Utilities","date":"2024-06-05"}' > /dev/null

R=$(req -X POST "$BASE/records" -H "Authorization: Bearer $REC_VIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"type":"income","category":"Other","date":"2024-06-01"}')
check "Create record (viewer) → 403" "$(code "$R")" 403 "$(body "$R")"

R=$(req -X POST "$BASE/records" -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":-50,"type":"income","category":"Other","date":"2024-06-01"}')
check "Create record negative amount → 400" "$(code "$R")" 400 "$(body "$R")"

R=$(req -X POST "$BASE/records" -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"type":"profit","category":"Other","date":"2024-06-01"}')
check "Create record invalid type → 400" "$(code "$R")" 400 "$(body "$R")"

R=$(req -X POST "$BASE/records" -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"type":"income","category":"Other","date":"not-a-date"}')
check "Create record invalid date → 400" "$(code "$R")" 400 "$(body "$R")"

R=$(req -X POST "$BASE/records" -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"type":"income"}')
check "Create record missing fields → 400" "$(code "$R")" 400 "$(body "$R")"

R=$(req -X GET "$BASE/records" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "List records (viewer)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/records?type=income" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "List records filter by type" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/records?category=sal" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "List records filter by category" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/records?from=2024-05-01&to=2024-05-31" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "List records filter by date range" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/records?page=1&limit=2" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "List records with pagination" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/records/$RECORD_ID" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "Get record by ID (viewer)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/records/000000000000000000000000" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "Get non-existent record → 404" "$(code "$R")" 404 "$(body "$R")"

R=$(req -X PUT "$BASE/records/$RECORD_ID" -H "Authorization: Bearer $REC_ANALYST_TOKEN" \
  -H "Content-Type: application/json" -d '{"amount":80000,"notes":"Updated"}')
check "Update record (analyst)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X PUT "$BASE/records/$RECORD_ID" -H "Authorization: Bearer $REC_VIEWER_TOKEN" \
  -H "Content-Type: application/json" -d '{"amount":80000}')
check "Update record (viewer) → 403" "$(code "$R")" 403 "$(body "$R")"

R=$(req -X DELETE "$BASE/records/$RECORD_ID" -H "Authorization: Bearer $REC_ANALYST_TOKEN")
check "Delete record (analyst) → 403" "$(code "$R")" 403 "$(body "$R")"

R=$(req -X DELETE "$BASE/records/$RECORD_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Delete record (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req -X GET "$BASE/records/$RECORD_ID" -H "Authorization: Bearer $REC_VIEWER_TOKEN")
check "Get soft-deleted record → 404" "$(code "$R")" 404 "$(body "$R")"

R=$(req -X DELETE "$BASE/records/$RECORD_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Delete already-deleted record → 404" "$(code "$R")" 404 "$(body "$R")"


# ── DASHBOARD ─────────────────────────────────────────────
echo ""
echo "[ DASHBOARD ]"

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"DashV\",\"email\":\"dv$S@t.dev\",\"password\":\"pass123\",\"role\":\"viewer\"}")
DV_TOKEN=$(field "$(body "$R")" "token")

R=$(req -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"DashA\",\"email\":\"da$S@t.dev\",\"password\":\"pass123\",\"role\":\"analyst\"}")
DA_TOKEN=$(field "$(body "$R")" "token")

R=$(req "$BASE/dashboard/summary" -H "Authorization: Bearer $DV_TOKEN")
check "Summary (viewer)" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/summary" -H "Authorization: Bearer $DA_TOKEN")
check "Summary (analyst)" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/summary" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Summary (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/summary")
check "Summary no token → 401" "$(code "$R")" 401 "$(body "$R")"

R=$(req "$BASE/dashboard/recent" -H "Authorization: Bearer $DV_TOKEN")
check "Recent activity (viewer)" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/recent?limit=5" -H "Authorization: Bearer $DV_TOKEN")
check "Recent activity with limit=5" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/categories" -H "Authorization: Bearer $DV_TOKEN")
check "Category breakdown (viewer) → 403" "$(code "$R")" 403 "$(body "$R")"

R=$(req "$BASE/dashboard/categories" -H "Authorization: Bearer $DA_TOKEN")
check "Category breakdown (analyst)" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/categories" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Category breakdown (admin)" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/trends" -H "Authorization: Bearer $DV_TOKEN")
check "Monthly trends (viewer) → 403" "$(code "$R")" 403 "$(body "$R")"

R=$(req "$BASE/dashboard/trends" -H "Authorization: Bearer $DA_TOKEN")
check "Monthly trends (analyst)" "$(code "$R")" 200 "$(body "$R")"

R=$(req "$BASE/dashboard/trends" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Monthly trends (admin)" "$(code "$R")" 200 "$(body "$R")"


# ── MISC ──────────────────────────────────────────────────
echo ""
echo "[ MISC ]"

R=$(req "$BASE/nonexistent-route")
check "Unknown route → 404" "$(code "$R")" 404 "$(body "$R")"

R=$(req "$BASE/records" -H "Authorization: Bearer bad.token.here")
check "Invalid JWT → 401" "$(code "$R")" 401 "$(body "$R")"

R=$(req "$BASE/records")
check "No token on protected route → 401" "$(code "$R")" 401 "$(body "$R")"


# ── SUMMARY ───────────────────────────────────────────────
total=$((pass+fail))
echo ""
echo "$LINE"
printf "  Passed : %d / %d\n" "$pass" "$total"
[ "$fail" -gt 0 ] && printf "  Failed : %d\n" "$fail"
echo "$LINE"
echo ""
