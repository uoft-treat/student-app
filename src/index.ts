import * as dotenv from 'dotenv';
import express     from 'express';
import * as path   from "path";
import bodyParser = require("body-parser");
import cookieParser = require('cookie-parser');
import session = require('express-session');
import flash = require('connect-flash');
import {request}   from 'graphql-request';

dotenv.config();

const app = express();

app.use(cookieParser('secret'));
app.use(session({cookie: {maxAge: 60000}}));
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.locals.messages = req.flash();
    next();
});

app.get('/', (req, res) => res.render('entry'));
app.post('/join', async (req, res) => {
    if (req.body.accessCode.length !== 6) {
        req.flash('error', 'Access code must be 6 digits.');
        res.redirect('/');
    } else {
        let result;
        try {
            result = await request("http://localhost:3000/graphql", `
                query ($accessCode: String!) {
                  experimentSession(accessCode: $accessCode) {
                    _id
                    experimentTemplate {
                     name
                     link
                    }
                  }
                }
            `, {accessCode: req.body.accessCode});
        } catch (e) {
            req.flash('error', 'Cannot find the session.');
            res.redirect('/');
        }
        res.redirect(result.experimentSession.experimentTemplate.link + "?sessionId=" + result.experimentSession._id);
    }
});

app.listen(process.env.PORT, () => console.log(`App started on port ${process.env.PORT}`));