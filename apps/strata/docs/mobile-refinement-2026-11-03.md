# Mobile reading and profile refinement

This follows the owner's screenshots from the first commons deployment. It uses the existing Taste v2 direction and same-origin Strata contract. No backend schema, auth, custody or AT publication behavior changes.

- The drawer has one shared scroll area, one navigation list and the account area. Compose is no longer trapped behind a separately fixed footer. Its existing focus trap, Escape, touch dismissal and close-on-route behavior remain.
- A bottom-right Menu control opens that same drawer. Messages remains a navigation item. The conversation reply dock continues to replace the ordinary bottom navigation while replying.
- The shell owns the single round Back control. Duplicate inner arrows on organizations, public work, contexts and wiki pages are removed; the existing history/scroll restoration is retained.
- On a phone, Lajur uses compact peer-feed tabs and an accessible custom configuration menu for changing, refreshing, adding and closing feeds. One feed is active. The document scrolls normally, without a fixed-height rounded viewport cutting off cards. Desktop columns retain independent scrollers.
- Video covers use one rounded 16:9 surface. Provider/title/source sit over the cover, with a one-line title and full link title available on focus/hover. The caption clears when Play activates the existing iframe/native controls. Metadata and covers can load; no player or video buffer loads before explicit Play.
- Explore's three shortcuts have top padding and fit the phone frame.
- Profiles have a restrained textured cover, overlapping initials, left-aligned identity, grouped share/edit/follow/message actions, optional bio/site/location, collapsed technical identity and sticky content tabs. There are no invented counts, affiliations, portraits or place banners. Avatar/banner uploads are not introduced here.
- Serat is the default for new appearance state. Valid saved Polos/Serat/Dither choices are retained.

## Gestures to evaluate

Configurable peer-feed swipes can be an optional shortcut over the visible tabs. A sidebar gesture should start inside a narrow edge zone while leaving the operating system's actual Back edge alone. Selection, editors, image carousels, players and dialogs must own their gestures. Per-feed scroll restoration should be defined before enabling a horizontal navigation gesture. Global page swiping is not introduced in this patch.

## Verification

The new loopback-only mobile journey checks single drawer scrolling at 320px, bottom Menu navigation, one Back control, normal document scrolling, configurable feed tabs, a cover-only video before Play, overlay removal after Play, Serat default and profile/feed bounds at 320/390/768/1440px. Existing commons, native-news/video, governance and rich-content journeys cover affected behavior. No test writes reach a deployed node.
