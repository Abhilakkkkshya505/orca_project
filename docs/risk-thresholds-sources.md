# ORCA Risk Thresholds: Citable Marine Safety Sources & Methodology

DEVELOPMENT VALUES. Not reviewed by a marine-safety expert. Official warnings override.

Version: **2026.10.0**  
Rules Engine: [`backend/apps/risk/rules.py`](file:///backend/apps/risk/rules.py)  
Threshold Definitions: [`backend/apps/risk/thresholds.py`](file:///backend/apps/risk/thresholds.py)

---

## 1. Regulatory Context & Safety Architecture

In accordance with Hard Safety Rules **S1**, **S2**, and **S8**:
- The safety rating (`safe`, `caution`, `unsafe`, `unknown`) is derived exclusively by a pure, deterministic rules engine.
- Missing or stale required data forces an `unknown` status and never defaults to `safe`.
- Official advisories issued by national meteorological and oceanographic authorities (India Meteorological Department - IMD, Indian National Centre for Ocean Information Services - INCOIS, and Indian Coast Guard) strictly override model assessments.
- When official advisory feeds cannot be verified, an explicit flag `advisory_unverified` is raised, confidence is capped at `medium`, and an unambiguous UI warning is rendered.

---

## 2. Cited Safety Guidance & Threshold Derivations

### A. Significant Wave Height ($H_{m0}$)
- **Small Craft (<12m open boats, fiberglass motorized skiffs, vallams)**:
  - Caution: **$1.5\text{ m}$**
  - Unsafe: **$2.2\text{ m}$**
  - *Source*: INCOIS Small Vessel Advisory and Warning Services (SVAS) operational criteria. INCOIS issues advisories for non-mechanised and small motorised craft when sea wave height is forecast to exceed $1.5\text{ m}$, and warnings when waves exceed $2.0\text{--}2.2\text{ m}$.
  - *Reference*: INCOIS Operational Ocean Services Portal: `https://incois.gov.in/portal/osf/osf.jsp`
- **Mechanised Vessels (Trawlers, gillnetters, purse seiners >15m)**:
  - Caution: **$2.5\text{ m}$**
  - Unsafe: **$3.8\text{ m}$**
  - *Source*: WMO Sea State Code 5 (Rough sea, $2.5\text{--}4.0\text{ m}$). Directorate General of Shipping, Govt. of India, circular on heavy weather precautions during southwest monsoon.
  - *Reference*: World Meteorological Organization (WMO) No. 558, Manual on Marine Meteorological Services.

### B. Wave Steepness ($S = H / T^2$)
- **Wave Steepness Index**:
  $$\text{Steepness} = \frac{H_{m0}}{T_p^2}$$
  In deep water, theoretical wavelength $L \approx 1.56 \cdot T^2$. When the ratio $H / L$ approaches $1/7 \approx 0.14$, waves reach maximum physical steepness and break violently. Expressed as $H/T^2$, values exceeding $0.04\text{ m/s}^2$ signify dangerous, short-crested steep waves that induce pitch-poling or swamping in small open craft.
  - Small Craft: Caution at **$0.040$**, Unsafe at **$0.060$**.
  - Mechanised: Caution at **$0.050$**, Unsafe at **$0.075$**.
  - *Source*: US Coast Guard Boat Crew Seamanship Manual (COMDTINST M16114.5C), Chapter 9: Breaking Waves and Wave Steepness.

### C. Swell Wave Height ($H_{swell}$)
- Long-period swells originating from the Southern Ocean create severe surf-zone shoaling and swell surge ("Kallakkadal") along the southwestern and eastern coasts of India.
  - Small Craft: Caution at **$1.2\text{ m}$**, Unsafe at **$2.0\text{ m}$**.
  - Mechanised: Caution at **$2.0\text{ m}$**, Unsafe at **$3.2\text{ m}$**.
  - *Source*: INCOIS Kallakkadal / Swell Surge Early Warning System guidelines.
  - *Reference*: `https://incois.gov.in/portal/swell_surge.jsp`

### D. Sustained Wind Speed (10-meter $U_{10}$) & Peak Gusts
- **Small Craft**:
  - Sustained: Caution at **$30.0\text{ km/h}$** (~$16\text{ knots}$, Beaufort 5), Unsafe at **$45.0\text{ km/h}$** (~$24\text{ knots}$, Beaufort 6 Strong Breeze).
  - Peak Gusts: Caution at **$40.0\text{ km/h}$**, Unsafe at **$55.0\text{ km/h}$**.
  - *Source*: IMD Marine Weather Bulletins: Fishermen warning thresholds for coastal areas. IMD advises fishermen not to venture into sea when wind speeds are expected to reach or exceed $40\text{--}50\text{ km/h}$ gusting to $55\text{ km/h}$.
  - *Reference*: IMD National Weather Forecasting Centre (NWFC) Marine Warning Bulletins: `https://mausam.imd.gov.in/`
- **Mechanised Vessels**:
  - Sustained: Caution at **$45.0\text{ km/h}$** (~$24\text{ knots}$), Unsafe at **$65.0\text{ km/h}$** (~$35\text{ knots}$, Beaufort 8 Gale).
  - Peak Gusts: Caution at **$60.0\text{ km/h}$**, Unsafe at **$80.0\text{ km/h}$**.
  - *Source*: Indian Port Safety and Maritime Operations circulars; IMD Squally Weather / Port Warning Signal No. 3 & 4.

### E. Precipitation Rate & Marine Visibility
- **Precipitation**:
  - Small Craft: Caution at **$10.0\text{ mm/h}$**, Unsafe at **$30.0\text{ mm/h}$**.
  - Mechanised: Caution at **$20.0\text{ mm/h}$**, Unsafe at **$50.0\text{ mm/h}$**.
  - *Source*: IMD heavy rainfall classification (moderate rain: 2.5-15.5 mm/h; heavy rain: >15.5-64.4 mm/h). Intense downpours cause rapid swamping of un-decked boats and acoustic blinding.
- **Meteorological Optical Range (Visibility)** (Note: *lower* values are worse):
  - Small Craft: Caution below **$2,000\text{ m}$**, Unsafe below **$1,000\text{ m}$**.
  - Mechanised: Caution below **$1,500\text{ m}$**, Unsafe below **$500\text{ m}$**.
  - *Source*: International Regulations for Preventing Collisions at Sea (COLREGS 1972) Rule 19 (Conduct of Vessels in Restricted Visibility) and IMD marine fog advisory standards.

### F. Ocean Surface Currents
- **Current Speed**:
  - Small Craft: Caution at **$1.5\text{ m/s}$** (~$2.9\text{ knots}$), Unsafe at **$2.5\text{ m/s}$** (~$4.9\text{ knots}$).
  - Mechanised: Caution at **$2.0\text{ m/s}$** (~$3.9\text{ knots}$), Unsafe at **$3.5\text{ m/s}$** (~$6.8\text{ knots}$).
  - *Source*: Navigational guidance for Indian tidal inlets and Gulf of Khambhat / Gulf of Kutch macrotidal currents (Indian Coast Guard and National Hydrographic Office).
