import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as yaml from "js-yaml";

const controls_xhr = new XMLHttpRequest();
controls_xhr.addEventListener("load", function (event) {
    if(this.status !== 200) {
        console.log("Couldn't load controls");
        return;
    }
    const config_yaml = this.responseText;
    window.config = yaml.safeLoad(config_yaml);

    ReactDOM.render(<App/>, document.getElementById('root'));
});
controls_xhr.open("GET", `controls.yaml`);
controls_xhr.send();
