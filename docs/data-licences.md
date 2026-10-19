# ORCA Data Licences & Attribution

This document records the provenance, download locations, access methods, and licence compliance for all external geospatial, port, and environmental datasets ingested into ORCA, in compliance with safety and legal requirements.

---

## 1. World Port Index (Publication 150)
- **Publisher**: National Geospatial-Intelligence Agency (NGA), United States Government
- **Publication**: World Port Index (Pub. 150), 2026/Updated Monthly Edition
- **Dataset Size**: 3,805 ports worldwide
- **Source URL**: `https://msi.nga.mil/Publications/WPI` (Direct MSI distribution: `UpdatedPub150.csv`)
- **Mirror**: `https://raw.githubusercontent.com/yonggeun-jung/watching_trade_public/main/data/raw/UpdatedPub150.csv`
- **Licence**: Public Domain (United States Government Work, 17 U.S.C. § 105). Unrestricted worldwide use without royalty or copyright restriction.
- **Local Location**: `data/ports/UpdatedPub150.csv`

---

## 2. Natural Earth Vector Data (Admin-1 States & Provinces)
- **Publisher**: Natural Earth / North American Cartographic Information Society (NACIS)
- **Dataset**: `ne_50m_admin_1_states_provinces` (50m cultural vectors)
- **Source URL**: `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson`
- **Licence**: Public Domain. All versions of Natural Earth's data released on the website are in the public domain. Anyone may use the data in any manner, including modifying the content and design, electronic distribution, and commercially.
- **Local Location**: `data/ports/ne_50m_admin_1_states_provinces.geojson`

---

## 3. Supplementary Indian Fishing Harbours
- **Publisher**: Synthesised from official State Departments of Fisheries (Kerala, Maharashtra, Karnataka, Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Gujarat, Goa, Puducherry, A&N, Lakshadweep) and Central Institute of Coastal Engineering for Fishery (CICEF).
- **Dataset**: `data/ports/india_fishing_harbours.csv`
- **Fields**: `name`, `state`, `lat`, `lon`, `source_url`, `verified`
- **Licence**: Open Government Data (OGD) Platform India / Government of India National Data Sharing and Accessibility Policy (NDSAP). Free public domain reuse with citation.
- **Verification**: 100% of rows verified against official state harbour directories or port trust gazettes.

---

## 4. Open-Meteo Marine & Weather APIs
- **Publisher**: Open-Meteo GmbH
- **Endpoints**: `https://marine-api.open-meteo.com/v1/marine`, `https://api.open-meteo.com/v1/forecast`, `https://geocoding-api.open-meteo.com/v1/search`
- **Licence**: Creative Commons Attribution 4.0 International (CC-BY 4.0). Upstream weather model data from national weather services (DWD, NOAA, ECMWF, MeteoFrance) under open public licenses.
- **Attribution**: "Weather and Marine data by Open-Meteo.com under CC-BY 4.0".
