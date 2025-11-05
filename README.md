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

## III. Examples

Here are examples from the current text that demonstrate the schema in practice.

#### Example 1: Simple Noun
A standard word with a single part of speech.

```json
{ "word": "rēx", "pos": "Noun" }
