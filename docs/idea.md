# reference-data-mcp-server

MCP server for common reference lookups — countries, timezones, currencies, elements, units, and other static datasets. Pure in-memory, no external API.

## Why

Agents constantly reach for small factual lookups: "What's the country code for Japan?", "What timezone is São Paulo in?", "Convert 5 miles to km", "What's the atomic number of tungsten?", "What does HTTP 422 mean?" These are individually too small for a dedicated server but collectively a high-frequency need. Bundling them into one server with static datasets means zero API dependencies, zero latency, zero auth, and zero rate limits.

## Source

- **API:** None — all data bundled as static JSON/TypeScript at build time
- **Auth:** N/A
- **Rate limits:** N/A (pure in-memory computation)

### Data sources for bundled datasets

| Dataset | Source | License |
|---|---|---|
| Countries | ISO 3166-1 (from `iso-3166-1` npm or similar) | Public standard |
| Languages | ISO 639-1/639-3 | Public standard |
| Currencies | ISO 4217 | Public standard |
| Timezones | IANA tz database (`tzdata` / Intl API) | Public domain |
| Periodic table | PubChem or static dataset | Public domain |
| Physical constants | NIST CODATA (2022 values) | Public domain |
| SI units | BIPM SI Brochure | Public domain |
| HTTP status codes | IANA HTTP Status Code Registry | Public domain |
| MIME types | IANA Media Types Registry | Public domain |
| Calling codes | ITU-T E.164 | Public standard |

## Scope

### Tool groups

#### Geography & locale

| Tool | Description |
|---|---|
| `ref_country_lookup` | Look up country by name, ISO alpha-2/3 code, or numeric code — returns full record (capital, region, languages, calling code, currency, TLD, flag emoji) |
| `ref_country_search` | Search/filter countries by region, subregion, language, currency, or keyword |
| `ref_language_lookup` | Look up language by name or ISO 639 code |
| `ref_currency_lookup` | Look up currency by name, ISO 4217 code, or country |

#### Time & date

| Tool | Description |
|---|---|
| `ref_timezone_convert` | Convert a datetime between timezones — handles DST transitions |
| `ref_timezone_lookup` | Timezone info by IANA ID or country — current offset, DST status, next transition |
| `ref_timezone_list` | List timezones, optionally filtered by country or UTC offset range |
| `ref_date_arithmetic` | Add/subtract durations, diff between dates, day-of-week, week number, leap year check |

#### Science

| Tool | Description |
|---|---|
| `ref_element_lookup` | Periodic table lookup by name, symbol, or atomic number — returns full element data |
| `ref_element_search` | Search/filter elements by group, period, category, or property range |
| `ref_constant_lookup` | Physical constant by name (e.g., "speed of light", "Avogadro") — value, unit, uncertainty |
| `ref_unit_convert` | Unit conversion across SI and common units — length, mass, volume, temperature, pressure, energy |

#### Web & standards

| Tool | Description |
|---|---|
| `ref_http_status` | HTTP status code lookup — code, reason phrase, description, RFC reference |
| `ref_mime_type` | MIME type lookup by type string or file extension |

## Design notes

- All datasets are static and loaded at startup. No network calls at runtime. This makes the server fast, reliable, and suitable for offline use.
- Timezone conversion uses the JavaScript `Intl` API and IANA database — no need for moment-timezone or similar. `Temporal` API (stage 3) is even better if the runtime supports it.
- Unit conversion should handle compound units (km/h, kg/m³) and not just simple pairs. Consider using a small expression evaluator or math.js subset.
- The periodic table dataset should include: atomic number, symbol, name, atomic mass, electron configuration, category (metal/nonmetal/metalloid), group, period, block, density, melting/boiling point, discovery year.
- Country data should be rich enough that agents don't need a separate geocoding call for basic facts — capital, population, area, region, subregion, borders, languages spoken, currencies used.
- Keep the bundled data small but complete. Total dataset size should be well under 10MB. Most of these are a few hundred to a few thousand records.
- Version the bundled data (e.g., "IANA tzdata 2024b", "CODATA 2022") so agents know what vintage they're querying.
