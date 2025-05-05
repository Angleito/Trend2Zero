const { Html, Head, Main, NextScript } = require('next/document');

function Document() {
    return (
        <Html lang="en">
            <Head />
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}

module.exports = Document;