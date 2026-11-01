window.CHANGELOG_EN = [
    {
        version: "0.a & 0.b",
        title: "Future Web Roadmap & Preview",
        date: "Coming Soon",
        tag: ["Preview", "Roadmap"],
        author: "Zhi Siong",
        content: `0.a Preview:
- Build a page for simulating large player samples, such as 1,000 players aiming for a target rate-up character and weapon setup (2+1), to compare off-banner losses, lucky wins, and other outcomes.
- Support recording multi-pull batches: if a character or weapon drops on pull 34, finish the ten-pull at pull 40 and record any additional high-rarity drops within that batch.
- Add an option to switch to single pulls after a chosen threshold, such as 70 pulls, for the remaining attempts.
- Support a starting pull budget, such as 200 pulls for a 2+1 target, and show successes, failures, and the mean/median pulls left for the next character.
- Allow randomized starting pity, such as a random value from 0 to 9.

0.b Preview:
- Add duplicate-copy overflow detection, using the required character copy count set in the gallery.
- Add currency from surplus copies, including regular currency awarded with pulls, and simulate converting it back into pulls at a ratio such as 20:1.
- Integrate this with 0.a to track starting pulls, pulls spent reaching the 2+1 target, and whether currency was exchanged for additional pulls.

Other Previews:
- Improve spark rules so that a recurring rule begins only after another rule triggers, matching Arknights: Endfield's recurring spark system.
- Spark rewards currently do not count toward either First N high-rarity rule. Add options to determine whether spark rewards affect other rules or only pity progress.
- Let the Simulator start with existing pity and prior high-rarity drop counts, for benefit rules and rate-up guarantees.
- Consider importing official banner pull records into Results page data entry.
- Add navigation to the corresponding high-rarity drop on the Results page.
- Add more Results page layouts, such as 2, 3, or 4 rows on desktop, disabled by default. Add scrolling modes such as scrolling only the last row, linked scrolling (all -1 +1), and simultaneous scrolling after evenly distributing results.
------------------------------------------------------------------
- Complete cloud storage.
- Improve the Settings page.
- (Personal) Remove or revise unused, redundant, and dead code, and move some logic into separate files to reduce frontend rendering file complexity.
- Adapt the layout for mobile devices.
- Replace Arknights images sourced from Bilibili Wiki with images from the official wiki.
- Light mode remains incomplete because development has mainly focused on the dark theme.
`
    },
    {
        version: "v0.2.5.12",
        title: "Bilingual Update",
        date: "16/10/2026",
        tag: [
            { scope: "Translation", type: ["Update"] },
            { scope: "Settings Page", type: ["Addition"] },
            "Fix",
        ],
        author: "ChatGPT & Zhi Siong",
        channel: {
            enabled: true,
            targetVer: "0.2",
            text: "Go to the latest v0.2 channel",
            path: "index.html"
        },
        content: `1. Added an editable icon beside the game name.

2. Bilingual Editing
2.1 Gallery Setup: Game names, banner names, rarity names, tag names, archive category names, and item full names and short names can now be entered separately in Chinese and English.
2.2 Pool Rules: The custom rescue display label now supports separate Chinese and English text.
2.3 The main input edits the current interface language. Click the arrow on its right to edit the other language in a dropdown panel below.
2.4 Added an “Enable bilingual editing” toggle below Bilingual Hints in Settings, disabled by default.
2.5 Turning it off preserves existing Chinese and English content and does not affect names switching with the interface language.

3. Pool Rules Improvements
3.1 Completed several missing translations.
3.2 Widened several select controls.
3.3 Removed the “Grand Prize” suffix from rarity options in pity rules.

4. Fixed Preview Lock on the Pool Rules page relying only on styling, which allowed custom dropdowns to remain editable.
5. Fixed section toggles still showing Chinese text in the English interface. They now correctly display Expand / Collapse.
6. Fixed the game name at the top of the Dashboard always using the Chinese field.

`
    },
    {
    "version": "v0.2.5.11",
    "title": "New Quick Settings Popover",
    "date": "15/10/2026",
    "tag": [
        {
            "scope": "Settings Popover",
            "type": [
                "Addition"
            ]
        },
        {
            "scope": "Settings Page",
            "type": [
                "Update",
                "Optimization",
                "Removal",
                "Fix",
                "Addition"
            ]
        }
    ],
    "author": "ChatGPT & Zhi Siong",
    "content": `1. Added a quick settings entry. Click Settings in the sidebar to open options for the current page; click Settings again while the popover is open to enter the full Settings page.
1.1 Disable the quick popover in Settings to open the Settings page directly.

2. Settings Page
2.1 Regrouped settings by purpose and page: Account, Startup & Navigation, Theme & Language, Results, Version Details, Data Entry Dialog, Simulator, Gallery Setup, Pool Rules, Bilingual Hints, Data & Cloud Management, and Danger Zone.
2.2 Replaced the default start-page dropdown with a grouped selection dialog. After selecting a game page, its game and page names appear on separate lines outside the dialog.
2.3 Removed the unimplemented data display format option and marked Light Mode as “Unfinished”.

3. Bilingual Hints & First-Visit Language Guide (Purpose: help first-time English-speaking visitors find Settings and change the interface language)
3.1 Bilingual text covers the sidebar Settings entry, settings popover hints, the interface language label, and language options.
3.2 On the first visit to Settings, the language selector is highlighted with bilingual guidance. Leaving Settings ends the guide, which does not appear on later visits.
3.3 Added a note below the bilingual toggle explaining the one-time automatic shutoff. Bilingual hints turn off when first leaving Settings, completing the guide; manually enabling them afterward will not trigger another automatic shutoff.

4. Page-Specific Settings
4.1 Version Details now saves its header layout and content alignment separately from Results.
4.2 Added full-width content alignment to Version Details. A header set to follow content also fills the available width.
4.3 Moved the Version Details line limit into the quick settings popover and Settings page, and saved the selection.
4.4 Removed the language selector from the Version Details header.
4.5 Gallery Setup and Pool Rules each gained four independently saved alignment options, accessible from their quick settings popovers and Settings page.
4.6 Added a show/hide option for rarity distribution analysis on Results; the export button remains available when hidden.
4.7 Added a note beside non-gold data entry preferences: automatic random selection also fills previously unspecified non-gold items while preserving existing item selections.
4.8 The homepage quick settings popover serves as the Account section. Login/Register continues to show the future-update notice, without adding authentication or cloud storage.

5. Simulator
5.1 Low-rarity display now switches instantly between full display and solid colors for existing results, without rerolling items or advancing pull progress.
5.2 Solid-color mode hides low-rarity selection controls while retaining their selections; full display restores them.
5.3 The selection summary, probability details, and mode description update together. Solid-color mode hides the low-rarity rate-up summary.
5.4 Changing low-rarity display in Settings also updates an already-open Simulator page.

6. Shared Select Controls
6.1 Option menus automatically open upward or downward to avoid clipping and unnecessary popover scrollbars.
6.2 Long text wraps and buttons grow vertically, eliminating horizontal scrolling.
6.3 Fixed mismatches between actual select values and displayed text, synchronizing initialization, programmatic assignments, dynamic options, language changes, and returning to a page.

7. Fixed preset banner names and configuration entries in the sidebar not updating immediately after a language change.
`
},
    {
        version: "v0.2.4.11",
        title: "Multi-Patch Update",
        date: "13/10/2026",
        tag: [
            { scope: "Game Config Page", type: ["Fix", "Optimization"] },
            { scope: "Rule Config Page", type: ["Fix", "Addition"] },
            { scope: "Simulator", type: ["Fix"] },
            { scope: "Changelog Page", type: ["Optimization"] },
            { scope: "Sidebar", type: ["Fix"] },
            { scope: "Local Storage", type: ["Fix"] },
            { scope: "Cloud Storage", type: ["Removal"] }
        ],
        author: "ChatGPT & Zhi Siong",
        content: `1. Game Config Page & Preview
1.1 Fixed an issue where leaving Manual Preview mode did not warn about unsaved changes.
1.2 Completed read-only protection for Preview and system presets: adding, removing, editing, and changing inputs are disabled; collapsing, filtering, and exporting remain available.
1.3 Improved gallery drag-and-drop behavior; the v0.2.3.10 workaround is no longer needed.
1.4 Unified sorting interactions on the Game Config page: banners, gallery categories, rarities, and tags are all reordered using drag handles.
1.5 Custom banners and gallery categories can now change icons. Added a shared icon-picker modal with common Emoji, custom input, and live preview.
1.5.1 Note: changing an icon shows a success message, but you still need to save the page configuration for it to persist.

2. Rule Config Page
2.1 Added drag-and-drop ordering for sub-probability groups and their combination conditions, guarantees, First N SSR guaranteed rate-up perks, First N SSR type targeting, special limited drops, spark rules, and free pulls.
2.1.1 Note: dragging only changes configuration order; it does not automatically change pull counts or probabilities. For example, First N SSR rules still trigger according to their configured SSR number.
2.2 Added unified configuration validation: errors now identify their locations and block saving without automatically changing inputs.
2.2.1 Checks soft pity ranges for out-of-bounds values, duplicates/overlaps, and reversed start/end values.
2.2.2 Checks for missing or invalid First N SSR indices and probabilities, spark trigger pull counts, free-pull amounts, and special limited rate boosts.
2.2.3 Checks whether the simulator's preselection minimum exceeds its maximum; equal values are allowed, and blank fields mean no corresponding limit.
2.2.4 (Detailed probability validation already existed; this is a reminder.)

2.5 When Assembly Mode switches to a General Pool, hide rate-up preselection limits and replace the other column with a full-width General Pool selection limit.
2.5.1 Note: switching back to Rate-Up mode before saving restores the original inputs. Rate-up limit data is removed only when a General Pool configuration is saved, preventing accidental data loss.
2.6 Fixed shared cross-banner candidate lists including legacy gallery groups; they now list only drawable banners.
2.7 Note: this only fixes the shared candidate list. The actual calculation for shared cross-banner guarantees has not yet been tested. (No current game appears to use this feature; it is presently a placeholder for potential split Arknights collaboration banners.)

3. Simulator
3.1 Fixed pull-count statistics and live probabilities not updating after each pull during consecutive single pulls.
3.2 Fixed free single pulls creating a new result group every time. Consecutive single pulls of the same type now accumulate up to 10 pulls or until the free-pull count ends.
3.3 Ten-pulls no longer append to an earlier incomplete single-pull group. Free pulls still create separate groups from paid pulls.
3.4 Fixed the Type Targeting “Reset All” action applying the wrong behavior; it now correctly recounts from the first SSR.

4. Sidebar: Fixed all game banners expanding after navigation; each game's expanded state is now retained.

5. Changelog Page
5.1 Fixed preset banner icons and lists differing between the changelog and other pages.
5.2 Update tags now always display on their own line; titles, version numbers, and date information wrap only when space is insufficient.
5.3 Optimized select-box width so it follows the original control setting instead of expanding to the currently selected font.
5.4: Added the original v0.0 version channel to test compatibility with multiple version channels.
5.5: Adjusted version numbering.

6. Local & Cloud Storage
6.1 Removed Firebase cloud-related code from the new version. The button remains as a notice that the service is paused, pending a future update.
6.2 Isolated v0.2 and v0.1 local/session storage by version to prevent legacy and new-version data from overwriting each other.
6.3 On first use of isolated storage, existing data is copied without removing the source. Local backups and resets are handled independently for each version.

7. Maintenance: reorganized Chinese and English translation dictionaries by feature, removed unused entries and duplicate declarations, and standardized translations shared by both languages.
`
    },
    {
        version: "v0.2.3.11",
        title: "(Personal) Code Modularization",
        date: "12/10/2026",
        tag: [{ scope: "Code", type: ["Modularization", "Organization"] }],
        author: "ChatGPT & Zhi Siong",
        content: `- (Personal) Split the code into multiple files to make it easier to reuse common logic in future updates.
`
    },
    {
        version: "v0.2.3.10",
        title: "Version Titles & Dual-Tier Tags",
        date: "12/10/2026",
        tag: [{ scope: "Changelog Page", type: ["Patch"] }],
        author: "Gemini & Zhi Siong",
        content: `- Added titles to the version page, updated tags to primary/sub tags (size tags), and retained the legacy tags
- Beautified select/option boxes globally
- Temporarily added drag-and-drop reordering for compendium/illustrated guide entries on the Game Config page (controls feel clunky; recommended workaround: place newly created entries at position 2 or 3, then move the preceding ones backward to make the new entry first)
- (Personal) Renamed files
- (Personal) Split translation files into separate Chinese and English files
`
    },
    {
        version: "v0.2.3.9",
        title: "Version Navigation & Style Tweaks",
        date: "09/10/2026",
        tag: [{ scope: "Version Page", type: ["Patch"] }],
        author: "Gemini & Zhi Siong",
        content: `- Added navigation to the version page to allow direct redirection to specific versions.
- Tweaked colors: fixed gradient incorrectly transitioning from blue to green; corrected to a pure blue gradient.
`
    },
    {
        version: "v0.2.3.8",
        title: "Engine Setup & Optimization Fixes",
        date: "09/10/2026",
        tag: [{ scope: "Engine Setup", type: ["Optimization", "Fixes"] }],
        author: "Gemini & Zhi Siong",
        content: `- Enhanced export, import, and quick-import from preset features; configs are now exported as a ZIP archive containing custom images (preset content references bundled site assets, so preset images are not duplicated into the ZIP).
- Fixed an issue where deleting a banner in the Engine Setup page could not be reverted if leaving without saving (deleted banners now revert to the bottom of the list, allowing users to re-enter and reorder them manually).
- Minor improvements including translation fixes, eliminating native browser dialogs, and resolving missing toast notifications upon completed actions.
- Addressed an issue where the "Import Config" button was missing on the new engine setup page in v0.2.3.7.
`
    },
    {
        version: "v0.2.3.7",
        title: "New Release Notes & History Page",
        date: "08/10/2026",
        tag: [{ scope: "Changelog Page", type: ["New Feature"] }],
        author: "Gemini & ChatGPT & Zhi Siong",
        content: `- Display release notes & version history on the frontend for viewing.
- Replace the homepage "Download .txt" action with a button navigating to this page.
- Update the "Return to v0.1" button on the Settings page to redirect here instead.
- Override the button on the v0.1 page as well to point to this page, allowing users to switch back.
- Version numbering note: although a new page was added, the implementation was relatively small, so it was categorized as a mid-sized update.
`
    },
    {
        version: "v0.2.2.7",
        title: "Patch: Results Showcase Page",
        date: "06/10/2026",
        tag: [{ scope: "Results Page", type: ["Removal", "Text Revisions", "Responsive Fix"] }],
        author: "Gemini & Zhi Siong",
        content: `1. Further removed code related to cloud storage.
2. Minor text and translation revisions.
3. Implemented a temporary small-screen layout adaptation for the results showcase page (a similar fix was applied to the pull simulator previously to ensure core usability). The remaining interfaces currently remain functional, though visually sub-optimal on smaller displays; a full overhaul will be carried out alongside future dedicated mobile adaptations.
`
    },
    {
        version: "v0.2.2.6",
        title: "Core System Overhaul",
        date: "03/10/2026",
        tag: [{ scope: "Core Engine", type: ["Major Refactor"] }, { scope: "Archive", type: ["Update"] }],
        author: "Gemini & ChatGPT & Zhi Siong",
        content: `Near-total overhaul; cloud storage has been temporarily removed.

Updates
1. Archive / Codex Configuration System
1.1: Restructured archives into: Primary Category (Character / Weapon / Pet) + Rarity / Tier + Tag Categories (Limited Rate-Up / Standard / Off-Banner Custom / Free Event / Sub-drops).
1.2: Added support for creating custom categories and tags. Rarity, tags, and categories can now be reordered via drag-and-drop (synchronizing global sort orders).
1.3: (Placeholder for future update) Added unified max-tier cap configurations across characters, weapons, and pets in preparation for overflow cashback recycling.
1.4: Added custom banner creation support—no longer strictly bound to fixed limited banners.

2. Banner Rate Engine & Redundant Feature Cleanup
2.1: Configurable pool drop scopes (by primary category + tag classification).
2.2: Target SSR assignment integrated directly into rarity and rate distribution.
2.3: Consolidated sub-drop guarantees, soft/hard pity, guaranteed rate-ups, and 50/50 guarantees into a unified multi-rarity pity engine.
2.4: Upgraded hard guarantee mechanics with progressive probability ramp-up curves.
2.5: Overhauled the pity recovery/consolation mechanic.
2.6: Overhauled the Spark system: targets can now be mapped via categories/tags, including custom selection from within designated tags.
2.7: Updated "First N SSR Target" configurations with tag/category filtering for cleaner targeting.
2.8: Updated special limited drop rate interventions with precise category/tag filters (tested at 20x rate to verify simultaneous special-limited and standard drops; selection remains on the simulator interface).
2.9: Updated pool selection constraints: added caps on selectable low-rarity and special limited targets.
2.10: Added banner resets tied to version patches (e.g., spark counters, first-SSR guarantees).

3. Gacha Simulation Interface
3.1: Restructured layout: Archive/Codex pinned to the top with the core system underneath.
3.2: Moved low-rarity rate-up and special limited target selection from modals directly into the Archive UI.
3.3: Improved selection ergonomics in the Archive:
3.3.1: Single-select mode automatically deselects previous targets when a new one is picked.
3.3.2: If an item is selected as both rate-up and standard off-banner, it is automatically unselected from the off-banner pool.
3.3.3: Special limited targets only boost drop chances rather than entering standard pools; unselecting the base standard character will automatically remove it from special limited targets.
3.4: Upgraded reset options to allow targeted resets (e.g., reset only 1 of 3 active spark rules), grouping trigger conditions and details together.
3.5: Guarantee/recovery counters now display directly below the rate indicators.
3.6: Cleaned up summary metrics above the results view; removed redundant items or moved them to relevant panels.
3.7: Converted the "Clear" button into "Start New Phase" (handles version-based rule resets like sparks and initial rate-up guarantees, adding divider blocks in history logs). Reverts to a plain refresh button if version sync is disabled.
3.8: Added a custom Spark target selection modal.
3.9: Optimized SSR search/filter: select a target as an anchor node, then navigate up/down between matching pulls.

4. Results Display Page
4.1: Overhauled the four main summary cards:
4.1.1: Sub-text now surfaces richer pull details.
4.1.2: Removed redundant current pity count (already displayed at the top of the data log).
4.1.3: Added total SSR drop count.
4.2: Added bottom export config options (import config planned for future build) and rarity distribution breakdown.
4.3: Overhauled result rendering:
4.3.1: Scroll containers now isolate the results list without shifting surrounding UI.
4.3.2: Adapted for banner updates with updated presentation and stricter validation for malformed data:
4.3.2.1: When "Carry-over pity" is disabled, previous pity counts persist safely beneath the session divider.
4.3.2.2: Active mechanics (sparks, first-win guarantees) properly reset from 0 when rule resets are triggered.
4.3.2.3: Improved spark anomaly alerts: forces a mock drop at the target threshold, marks it as an anomaly, and resets subsequent pity from 0.
4.3.2.4: Progressive guarantee check: detects and flags invalid states where a non-rate-up drop occurs despite reaching 100% guarantee probability.
4.4: Data Entry Mode Enhancements:
4.4.1: Added "Exit Without Saving" option.
4.4.2: Deletion now requires explicit "Delete Mode", with full undo/revert support.
4.4.3: Creation controls and standard exit triggers are hidden during Delete Mode.
4.4.4: Added jump-to-pull search navigation.

5. Navigation & Order
Sidebar banner ordering now supports drag-and-drop; reordering in Game Settings syncs with the sidebar immediately (and vice versa).

6. Settings
Added a "Rollback / View v0.1" button in Settings (for reference and UI comparison only; legacy modules will not receive future archive updates).

7. Safety Prompts
Added unsaved changes confirmation prompts with a "Save and Exit" action.

Functional Changes:
1. Banner routing and hybrid pool mechanic settings moved into the Banner Rate Engine.
2. Replaced full confirmation dialogs with lightweight, auto-dismissing toast notifications for finished actions.

Bug Fixes:
1. Fixed an issue where exiting the rate customization screen still triggered an auto-save.

Archive Updates:
Populated most baseline content (too extensive to list in detail). Rule logic is still being tuned and will be completed over time.
(Surprise find: HSR Wiki added Aha assets, and ZZZ assets dropped for Fione and Severian, so they have been integrated).
`
    },
    {
        version: "v0.1.2.6",
        title: "Multi-Feature Expansion",
        date: "19/09/2026",
        tag: [{ scope: "Core Engine", type: ["Update"] }, { scope: "Archive", type: ["Update"] }],
        author: "Gemini & ChatGPT & Zhi Siong",
        channel: {
            enabled: true,
            targetVer: "0.1",
            text: "Switch to v0.1 Legacy Channel (Benchmarking)",
            path: "0.1 old/index.html",
        },
        content: `1. Added low-rarity items to the Archive / Compendium
1.1 Corresponding mechanics updates:
1.1.1 Added rate-up options, boosted probabilities, and hard guarantee (pity) mechanics for low-rarity items (primarily modeled after Zenless Zone Zero, etc.).
1.1.2 Split probability pools for different item categories (Characters + Weapons) within the same rarity tier. For instance:
i. In Zenless Zone Zero, 4-star Agents and 4-star W-Engines have distinct base drop rates.
ii. When categories share an even 50/50 split despite unequal item counts (e.g., 30 characters share 50% of the pool's weight, while 20 Light Cones share the other 50%).

1.2 Quality-of-life (QoL) & workflow simplifications:
1.2.1 Low-rarity archive selection is now optional when manually entering pull data; the system can automatically randomize low-rarity drops.
1.2.2 Low-rarity drops can now be hidden during warp/gacha simulations to emphasize target 5-star/S-rank pulls.

1.3 UI & display optimizations:
1.3.1 Simulation screen now allows expanding and viewing the breakdown of split probabilities within the same rarity tier.
1.3.2 Separated the display slots for hard pity (guarantee) and spark milestones (since they operate on distinct mechanics).

2. Added invalid data detection; the progress bar turns black as an alert under the following triggers:
2.1 Character unselected or invalid (e.g., deleted from the archive).
2.2 Existing pity count exceeds the hard pity threshold.
2.3 Gold / highest-tier drop triggered beyond the hard pity threshold.
2.4 Standard drop obtained when hard guarantee was active.
2.5 Standard drop obtained during a guaranteed featured drop within the first N gold pulls.
2.6 Invalid targeted category/item type within the first N gold pulls.
2.7 "Capturing Radiance" failed to trigger/rescue an off-rate standard drop when expected.
2.8 Spark / pull milestone reached without granting the guaranteed gold drop.

3. Added new hints/tips — feel free to explore!

4. Added & refined banner/pool rules:
4.1 "Capturing Radiance" mechanic.
4.2 Refined spark rules with support for pull count offsets on the first gold drop.
4.3 Guaranteed on-banner pull (no 50/50 loss) for "Exclusive Rerun" style banners.
4.4 Zenless Zone Zero beginner standard banner perks (guaranteed specific character/weapon type on first S-rank).

Minor Fixes:
1. When entering data for pure standard banners, the character/weapon display area now matches the size of limited banners instead of being constrained to two cramped rows.

Preset Archive Updates:
Added low-rarity archives and select limited archives for Zenless Zone Zero and Arknights: Endfield.
`
    },
    {
        version: "v0.0.2.6",
        title: "Interface Optimizations",
        date: "08/09/2026",
        tag: [
            { scope: "Sidebar", type: ["Optimization"] },
            { scope: "Results Page", type: ["Optimization"] },
            { scope: "Simulator", type: ["Responsive Fix"] },
            { scope: "Home", type: ["Text Update"] }
        ],
        author: "Gemini & Zhi Siong",
        content: `1. Optimized sidebar display (collapsible sidebar toggle, integrated home branding with site title, etc.).
2. Revamped the results showcase interface with multiple customizable display preferences.
3. Added support for importing game configuration files alongside existing export functionality.
4. Fixed an issue where gacha simulation took up the entire screen on smaller windows; added dedicated sidebar and improved visual presentation.
5. Updated main page and settings page.

Roster / Gallery: Please allow me not to update this, thank you.
`
    },
    {
        version: "v0.0.1.6",
        title: "Archive Update",
        date: "26/05/2026",
        tag: [{ scope: "Archive", type: ["Update"] }],
        author: "Zhi Siong",
        channel: {
            enabled: true,
            targetVer: "0.0",
            path: "0.0 old/index.html"
        },
        content: `Arknights: Violet Mizutsune Orchid (screenshot), Kal'tsit Esperanta, Closure | Official art
Zenless Zone Zero: Velina, Norma, Starlight - Billy | Official art
Honkai: Star Rail: Himeko-Nova, Until the Flowers Bloom Again | Official art
Arknights: Endfield: Mi Fu, Camille | Official art
`
    },
    {
        version: "v0.0.1.5",
        title: "Archive Update",
        date: "22/05/2026",
        tag: [{ scope: "Archive", type: ["Update"] }],
        author: "Zhi Siong",
        content: `Gallery Update:
Honkai: Star Rail: Himeko-Nova, Tohsaka Rin, Gilgamesh, Reforged in Helldire (screenshot)
Zenless Zone Zero: Velina, Norma (screenshot), Promeia, Frostfall Sickle | Official art
Arknights: Endfield: Mi Fu, Camille, Amaranthine Tassel, Blessing Of Lustrous Carmine (screenshot)
`
    },
    {
        version: "v0.0.1.4",
        title: "Archive Update",
        date: "26/04/2026",
        tag: [{ scope: "Archive", type: ["Update"] }],
        author: "Zhi Siong",
        content: `Honkai: Star Rail: Welcome to the Cosmic City | Official art
Zenless Zone Zero: Serpentine Seeker, Frostfall Sickle, Starlight Rider Faceplate (screenshot)
Arknights: Endfield: Zhuang Fang Yi, Lone Barge | Official art
Arknights: Kal'tsit Esperanta, Closure (screenshot)
`
    },
    {
        version: "v0.0.1.3",
        title: "Archive Update",
        date: "11/04/2026",
        tag: [{ scope: "Archive", type: ["Update"] }],
        author: "Zhi Siong",
        content: `Arknights: Endfield: Zhuang Fang Yi, Lone Barge (screenshot). Special Headhunting — Fest of Brilliance
`
    },
    {
        version: "v0.0.1.2",
        title: "Archive Update",
        date: "10/04/2026",
        tag: [{ scope: "Archive", type: ["Update"] }],
        author: "Zhi Siong",
        content: `Honkai: Star Rail: Welcome to the Cosmic City (screenshot), Until the Flowers Bloom Again (screenshot), Blade: Forge Master (official wiki image); Silver Wolf, Argenti, Yunli join Celestial Invitation characters
`
    },
    {
        version: "v0.0.1.1",
        title: "Archive Update",
        date: "08/04/2026",
        tag: [{ scope: "Archive", type: ["Update"] }],
        author: "Zhi Siong",
        content: `Honkai: Star Rail: Blade: Forge Master (screenshot), Blade: Forge Master Signature Light Cone (no image, unnamed)
Arknights: Zima the Raging Tide (English name corrected, image corrected)
`
    },
    {
        version: "v0.0.1.0",
        title: "Fixes & Updates",
        date: "04/04/2026",
        tag: [{ scope: "Archive", type: ["Update"] }, "Fixes", "Updates"],
        author: "Gemini & Zhi Siong",
        content: `Fixes:
- Fixed an issue where the sync panel would not appear after logging in on the settings page.
- Fixed an issue where the 10-pull guarantee for lower-tier golds was automatically detecting the highest gold rather than using the configured level.
- Fixed an issue where searching for gold was bound to legacy 5-star logic instead of target gold.
- Fixed an issue where standard banner display effect incorrectly flagged all drops as off-banner (lost 50/50).
- Fixed an issue where display interface title remained in Chinese while in English language mode.
- Fixed untranslated text in the data merge popup.
- Fixed the issue where the 10-pull guarantee mechanism for free pulls was not triggering.

Updates:
- Added option to disable the hard pity threshold.
- Downloading historical update notes will now automatically download either the Chinese or English version based on current language setting.

Preset Gallery:
Expanded Gallery:
- Zenless Zone Zero: Neon Fantasies, Promeia (non-avatar), Starlight - Billy (non-avatar), and both of their signature W-Engines (unnamed, no image).
- Honkai: Star Rail: Welcome to Galaxy City (no image), Evanecia Light Cone (unnamed, no image).
- Arknights: Endfield: Rossi + Signature Weapon.
- Arknights: Raging Tide - Frozen Winter (non-avatar), April Fools skin change for EW.

Arknights Banners: Separated limited banners; past accompanying new standard characters added to rate-up pool.
`
    },
    {
        version: "v0.0.0.0",
        title: "Initial Release",
        date: "01/04/2026",
        tag: ["Release"],
        author: "Gemini & Zhi Siong",
        content: `First beta test version released.
`
    }
];
