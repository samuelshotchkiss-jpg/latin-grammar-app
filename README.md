# Latin Grammar Practice App: data.json Specification

This document outlines the required format for the `data.json` file used by the Latin Grammar Practice application. The purpose is to provide a clear specification for a human or an LLM to process a new Latin text and generate a valid `data.json` file.

## I. Overall Structure

The `data.json` file is a single JSON array `[]`. Each element in the array is an object `{}` that represents a single word, a piece of punctuation, or a paragraph break.

## II. Object Properties (The Schema)

Each object in the array can have the following properties:

| Property        | Type                          | Required? | Description                                                                                                                                                             |
| --------------- | ----------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `word`          | `string`                      | **Yes**   | The literal text of the word or punctuation mark.                                                                                                                       |
| `pos`           | `string` or `array of strings`  | **Yes**   | The part(s) of speech. Use an array for words with a dual nature (e.g., participles). Valid values: `"Noun"`, `"Verb"`, `"Adjective"`, `"Pronoun"`, `"Adverb"`, etc.      |
| `type`          | `string`                      | Optional  | Used exclusively for paragraph breaks. The only valid value is `"break"`. A `type: "break"` object should not have `word` or `pos` properties.                        |
| `compositeVerb` | `string`                      | Optional  | A unique ID shared by all parts of a single, separated verb (e.g., `interfectus` and `est`). Each composite verb in the text should have its own unique ID (e.g., `"verb1"`, `"verb2"`). |
| `feedback`      | `object`                      | Optional  | An object containing context-specific tooltips. The **keys** are the part of speech the student guessed (`"Noun"`, `"Verb"`, `"Adjective"`). The **values** are the message strings. To show no message for a specific guess, use an empty string `""`. |
| `noSpaceAfter`  | `boolean`                     | Optional  | Used for words that are visually attached to the following word, such as the host word for an enclitic (e.g., `-que`). Set to `true` to prevent a space from being rendered after the word. |

## III. Examples

Here are examples from the current text that demonstrate the schema in practice.

#### Example 1: Simple Noun
A standard word with a single part of speech.

```json
{ "word": "rēx", "pos": "Noun" }
```

#### Example 2: Composite Verb
`expulsus est` is a single verb. Both parts share `compositeVerb: "verb3"`.

```json
{ "word": "expulsus", "pos": "Verb", "compositeVerb": "verb3" },
{ "word": "est", "pos": "Verb", "compositeVerb": "verb3" }
```

#### Example 3: Dual-Nature Participle
`dolēns` can be both a verb and an adjective. Its `pos` is an array. The feedback messages are keyed to the student's correct guess.

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

#### Example 4: Complex Feedback ("Superbus")
`Superbus` is a noun. We provide specific feedback if the student correctly identifies it, if they make a reasonable mistake ("Adjective"), or no feedback at all for an unlikely guess ("Verb").

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
The word `obaerātōsque` is split into two separate items. The first item, `obaerātōs`, receives the `noSpaceAfter: true` flag to ensure it renders correctly without a space before `-que`.

```json
{ "word": "obaerātōs", "pos": "Noun", "noSpaceAfter": true },
{ "word": "que", "pos": "Conjunction" }
```

## IV. Instructions for LLM

**Prompt:**
```
Here is a Latin text. Please process it into a `data.json` file according to the provided specification and examples. Tag every word by its part of speech (`pos`). For words that are parts of a composite verb (like the perfect passive system), assign them a shared, unique `compositeVerb` ID. For words with grammatical ambiguity or common points of confusion, add a `feedback` object with helpful, context-specific messages for students. Ensure paragraph breaks are marked with `{ "type": "break" }`. Pay close attention to dual-nature words like participles and gerundives, listing their `pos` in an array. Handle enclitics like `-que` by splitting them from their host word into a separate object and adding the `"noSpaceAfter": true` property to the host word object.
```
