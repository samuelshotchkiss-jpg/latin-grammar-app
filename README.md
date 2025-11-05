# Latin Grammar Practice App: Content File Specification

This document outlines the required format for the JSON content files used by the Latin Grammar Practice application. The purpose is to provide a clear specification for a human or an LLM to process a new Latin text and generate a valid JSON file.

## I. Multi-Text Functionality

The application is designed to load different Latin texts. This is controlled via a URL parameter.

-   If no parameter is provided, the app will load the default `data.json` file.
    -   `.../index.html` -> loads `data.json`
-   If a `?text=` parameter is in the URL, the app will load the corresponding `.json` file.
    -   `.../index.html?text=dbg1c4-5` -> loads `dbg1c4-5.json`
    -   `.../index.html?text=ovid` -> loads `ovid.json`

This specification applies to `data.json` and any other text file you create.

## II. Overall Structure

Each content file (e.g., `data.json`, `dbg1c4-5.json`) is a single JSON array `[]`. Each element in the array is an object `{}` that represents a single word, a piece of punctuation, or a paragraph break.

## III. Object Properties (The Schema)

Each object in the array can have the following properties:

| Property        | Type                          | Required? | Description                                                                                                                                                             |
| --------------- | ----------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `word`          | `string`                      | **Yes**   | The literal text of the word or punctuation mark.                                                                                                                       |
| `pos`           | `string` or `array of strings`  | **Yes**   | The part(s) of speech. Use an array for words with a dual nature (e.g., participles). Valid values: `"Noun"`, `"Verb"`, `"Adjective"`, `"Pronoun"`, `"Adverb"`, etc.      |
| `type`          | `string`                      | Optional  | Used exclusively for paragraph breaks. The only valid value is `"break"`. A `type: "break"` object should not have `word` or `pos` properties.                        |
| `compositeVerb` | `string`                      | Optional  | A unique ID shared by all parts of a single, separated verb (e.g., `interfectus` and `est`). Each composite verb in the text should have its own unique ID (e.g., `"verb1"`, `"verb2"`). |
| `feedback`      | `object`                      | Optional  | An object containing context-specific tooltips. The **keys** are the part of speech the student guessed (`"Noun"`, `"Verb"`, `"Adjective"`). The **values** are the message strings. To show no message for a specific guess, use an empty string `""`. |
| `noSpaceAfter`  | `boolean`                     | Optional  | Used for words that are visually attached to the following word, such as the host word for an enclitic (e.g., `-que`). Set to `true` to prevent a space from being rendered after the word. |

## IV. Examples

Here are examples that demonstrate the schema in practice.

#### Example 1: Simple Noun

```json
{ "word": "rēx", "pos": "Noun" }
```

#### Example 2: Composite Verb

```json
{ "word": "expulsus", "pos": "Verb", "compositeVerb": "verb3" },
{ "word": "est", "pos": "Verb", "compositeVerb": "verb3" }
```

#### Example 3: Dual-Nature Participle

```json
{
    "word": "dolēns",
    "pos": ["Verb", "Adjective"],
    "feedback": {
        "Verb": "That's it! 'dolēns' is a participle. As a verb, it describes action ('grieving'). As an adjective, it modifies 'Brūtus'.",
        "Adjective": "That's it! 'dolēns' is a participle. As an adjective, it modifies 'Brūtus'. As a verb, it describes action ('grieving')."
    }
}
```

#### Example 4: Complex Feedback

```json
{
    "word": "Superbus",
    "pos": "Noun",
    "feedback": {
        "Noun": "Correct! Even though it looks like an adjective, in this context 'Superbus' is a cognomen (a name), which acts as a proper noun.",
        "Adjective": "You're on the right track! It's shaped like an adjective, but here 'Superbus' is a cognomen (a name) and functions as a proper noun.",
        "Verb": ""
    }
}
```

#### Example 5: Enclitic Handling

```json
{ "word": "obaerātōs", "pos": "Noun", "noSpaceAfter": true },
{ "word": "que", "pos": "Conjunction" }
```

## V. Instructions for LLM

**Prompt Template:**
```
Please process the following Latin text into a JSON file named `[filename].json` according to the provided specification and examples.

**Specification Highlights:**
- Tag every word by its part of speech (`pos`).
- For multi-word verbs (like the perfect passive system), assign a shared, unique `compositeVerb` ID.
- For words with grammatical ambiguity, add a `feedback` object with helpful, context-specific messages.
- Mark paragraph breaks with `{ "type": "break" }`.
- For dual-nature words like participles, list their `pos` in an array (e.g., `["Verb", "Adjective"]`).
- Handle enclitics like `-que` by splitting them from their host word into a separate object and adding the `"noSpaceAfter": true` property to the host word object.

**Latin Text:**
[PASTE LATIN TEXT HERE]
