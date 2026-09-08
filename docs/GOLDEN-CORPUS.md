# Golden Correlation Corpus

The golden corpus exists to exercise different epistemic failure modes, not to maximize case count.

| Case | Pattern under test | Domains | Primary state |
|---|---|---|---|
| Jerusalem / Second Temple, 70 CE | text-story-event-person correspondence without fulfillment verdict | TEXT · STORY · EVENT · PERSON | PARTIAL / SUPPORTED |
| Lindow Man | competing interpretations around violent death | EVENT · STORY | DISPUTED |
| Bath curse tablets | material evidence versus reconstructed ritual intent | EVENT · STORY | PARTIAL |
| Oseberg women | person/event linkage with unresolved historical identity | EVENT · PERSON · STORY | PARTIAL / UNRESOLVED |
| ICC temporal jurisdiction | legal applicability without guilt/judgment | EVENT · LAW | SUPPORTED |

Together the five historical cases cover the original five source-domain fixtures:

```text
STORY  ✓
EVENT  ✓
PERSON ✓
TEXT   ✓
LAW    ✓
```

The current machine contract also supports:

```text
PERSPECTIVE → rocksoul-jizz ✓
```

No sixth golden case is fabricated merely to satisfy a coverage counter. Add a PERSPECTIVE-bearing golden case only when it exercises a materially new correlation failure mode.

## Reference resolution

A correlation reference has one of two resolution states.

### `canonical`

The referenced record is already minted by the owning source repository. Correlation may cite it, but may not redefine it.

### `candidate`

The real-world relationship is useful to model, but one or both source repositories have not yet minted the referenced record. Candidate references are deliberately visible and must not be rendered as canonical provenance.

```text
candidate correlation
        ↓
owner repo review
        ↓
canonical source record minted
        ↓
correlation reference promoted
```

Promotion must happen only after the owning repository publishes the record with a stable identifier.

## Acceptance rules

Every golden-case edge must:

1. use the canonical repository for its domain;
2. declare a bounded relation type;
3. include supporting evidence;
4. expose counterevidence and/or alternatives when the state is not straightforwardly supported;
5. keep five independent dimension scores visible;
6. keep confidence in `0..1`;
7. distinguish candidate from canonical references;
8. cite at least one inspectable source;
9. state special boundaries for legal applicability;
10. avoid causal, theological, legal, or identity conclusions that exceed the evidence represented by the edge.

## Golden-case intent

### Jerusalem 70 CE

Regression guard: correspondence must not become a supernatural-fulfillment verdict. Witness proximity must not become infallibility.

### Lindow Man

Regression guard: a vivid ritual interpretation must not suppress violent-crime or execution alternatives.

### Bath curse tablets

Regression guard: a convenient modern category such as “curse” must not erase restitution, prayer, legal complaint, or mixed ritual intent.

### Oseberg women

Regression guard: biological/person evidence must not be inflated into named identity, status, or ritual role without support.

### ICC temporal jurisdiction

Regression guard: a legally relevant temporal relation must not become a finding of jurisdiction, admissibility, liability, crime commission, or guilt.

## Expansion policy

Do not add a sixth golden case merely because another interesting case exists. Add one only when it exercises a materially new semantic or validation failure mode.

Ordinary reviewed correlation data may grow outside the golden set once ingestion/publishing workflows are implemented.
