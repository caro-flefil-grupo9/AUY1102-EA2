const express = require('express');
const bodyParser = require('body-parser');
const pug = require('pug');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Remediación SonarCloud (Reglas tssecurity:S5496 y typescript:S7790)
// Se evita la inyección en plantilla (SSTI) compilando una plantilla estática y pasando los parámetros como variables locales
const compiledTemplate = pug.compile(`doctype html
html
  head
    title Hello world
  body
    form(action='/' method='post')
      input#username.form-control(type='text' name='username' value=username)
      button.btn.btn-primary(type='submit') Submit
    p Hello #{username}`);

app.post('/', (req, res) => {
  const input = req.body.username;
  const html = compiledTemplate({ username: input });
  res.send(html);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
