/**
 * PDF Mapping Configuration
 * Store all technical sheet PDF URLs here
 * Maintainable and easy to update
 */

export const pdfMapping = {
    // Mapping by film_id
    "55": {
        url: "https://your-cdn.com/tech-sheets/55_prestige_tint.pdf",
        name: "Prestige Series Technical Sheet",
        description: "High-performance nano-ceramic tint"
    },
    "67": {
        url: "https://your-cdn.com/tech-sheets/67_carbon_tint.pdf",
        name: "Carbon Series Technical Sheet",
        description: "Premium carbon film technology"
    },
    "89": {
        url: "https://your-cdn.com/tech-sheets/89_ceramic_tint.pdf",
        name: "Ceramic Series Technical Sheet",
        description: "Advanced ceramic heat rejection"
    },
    "101": {
        url: "https://your-cdn.com/tech-sheets/101_metalized_tint.pdf",
        name: "Metalized Series Technical Sheet",
        description: "Durable metalized construction"
    },
    "112": {
        url: "https://your-cdn.com/tech-sheets/112_hybrid_tint.pdf",
        name: "Hybrid Series Technical Sheet",
        description: "Best value dyed + metalized"
    },
    
    // Mapping by label keywords (fallback)
    "keywords": {
        "prestige": "55",
        "carbon": "67",
        "ceramic": "89",
        "metalized": "101",
        "hybrid": "112"
    },
    
    // Default fallback
    "default": {
        url: null,
        name: null
    }
};

// Helper function to get PDF by film_id or label
export const getPdfByFilm = (filmId, filmLabel) => {
    // Try exact match by ID
    if (filmId && pdfMapping[filmId]) {
        return pdfMapping[filmId];
    }
    
    // Try keyword match by label
    if (filmLabel) {
        const labelLower = filmLabel.toLowerCase();
        for (const [keyword, mappedId] of Object.entries(pdfMapping.keywords)) {
            if (labelLower.includes(keyword)) {
                return pdfMapping[mappedId];
            }
        }
    }
    
    return pdfMapping.default;
};