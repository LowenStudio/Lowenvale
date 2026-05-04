# Lowenvale Co.,Ltd. Website

Static corporate website files:

- `index.html` - main company website
- `board.html` - company information and legal notice board
- `data/board.js` - editable board notice data
- `files/notices/` - uploaded files attached to notices
- `assets/css/styles.css` - small custom CSS
- `assets/js/main.js` - mobile menu, reveal animation, and board rendering

## Update the Company Board

Open `data/board.js` and add a new item at the top of `window.lowenvaleBoard`.

Example:

```js
{
  uploadedDate: "2026-05-04",
  title: "Notice title",
  contents: "Full notice contents shown on the card and popup.",
  attachments: [
    {
      name: "Attachment display name",
      url: "files/notices/your-file.pdf",
    },
  ],
},
```

The homepage shows the latest three items. `board.html` shows all items.

To attach a file, place it inside `files/notices/` and add it to the notice `attachments` list. Leave `attachments: []` when there are no files.
