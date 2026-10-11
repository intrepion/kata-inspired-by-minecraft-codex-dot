# Finite deterministic world with sparse edits

Accepted. A compact glade makes visible terrain, collision and saves tractable. Infinite chunks would add generation and seam complexity without improving the opening loop. Seed generation is frozen by save version 1; edits store exact replacements. Save validation rejects unsupported versions and out-of-bounds edits instead of partially loading. Changes to terrain generation require a save migration or new version. Offline local storage has no cloud synchronization; one local backup protects the last validated snapshot.
