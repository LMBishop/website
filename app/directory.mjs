'use strict';

import { PAGES_DIR } from './constants.mjs';
import { parse } from './wikiparser.mjs';
import { readFileSync, readdirSync } from 'fs';

const pages = {};
const metadata = {};

const PURGE_COOLDOWN_MIN = 10;

export function pageFor(path) {
    path = path.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    let page = pages[path];
    if (!page) {
        return undefined;
    }

    if (!page.html) {
        buildPage(path);
        return pages[path];
    }

    return page;
}

export function buildPage(path) {
    let data = readFileSync(`${PAGES_DIR}/${path}.wiki`, 'utf-8'); 
    let result = parse(data);
    let title = result.metadata.displayTitle ?? 'Unnamed page';
    let content = `<h1>${title}</h1>${result.html}`;

    let page = {
        html: content,
        buildTime: result.metadata.buildTime,
        hidden: result.metadata.hidden,
        displayTitle: title
    };
    pages[path] = page;
}

export function rebuild() {
    for (var page in pages) {
        delete pages[page];
    }

    readdirSync(PAGES_DIR).forEach(file => {
        if (!file.endsWith('.wiki')) {
            return;
        }
        file = file.replace('.wiki', '');
        buildPage(file);
    });
    metadata.fileTreeBuildTime = new Date();
}

export function exists(path) {
    return !!pages[path];
}

export function rawDataFor(path) {
    return pages[path];
}

export function purge(path) {
    let page = pages[path];
    if (page) {
        if (page.buildTime.getTime() + PURGE_COOLDOWN_MIN * 60 * 1000 > Date.now()) {
            return false;
        } else {
            pages[path] = {};
            buildPage(path);
            return true;
        }
    }
    return false;
}

export function getPages() {
    return pages;
}

export function getNavbar(current = '') {
    let navbar  = '';
    for (const path of Object.keys(pages)) {
        if (pages[path].hidden) {
            continue;
        }
        navbar = navbar + `<div class="navbar-element"><a href="/${path}"${current == path ? ' class="highlight"' : ''}>${pages[path].displayTitle}</a></div>`;
    }
    return navbar;
}
