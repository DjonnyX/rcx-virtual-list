const path = require('path');

const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { ProgressPlugin } = require('webpack');

module.exports = function (env, argv) {
    return {
        mode: argv.mode,
        entry: path.resolve(__dirname, 'src/index.ts'),
        output: {
            filename: 'index.js',
            library: '$',
            libraryTarget: 'umd',
            path: path.resolve(__dirname, 'dist'),
        },
        devtool: 'source-map',
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    exclude: /node_modules/,
                    use: [MiniCssExtractPlugin.loader,
                        "style-loader",
                        "css-loader",
                        "postcss-loader",
                    ],
                },
                {
                    test: /\.(js|ts)x?$/,
                    exclude: /node_modules/,
                    use: ['babel-loader', 'ts-loader']
                },
            ]
        },
        externals: {
            'react': 'react',
            'react-dom': 'react-dom'
        },
        resolve: {
            alias: {
                '@root': path.resolve(__dirname, 'src')
            },
            extensions: ['.js', '.jsx', '.ts', '.tsx']
        },
        plugins: [
            new ProgressPlugin(),
            new MiniCssExtractPlugin({
                filename: 'index.css', // Output filename for extracted CSS
            }),
            // new ESLintPlugin({
            //     extensions: ['.js', '.jsx', '.ts', '.tsx']
            // }),
            new CopyPlugin({
                patterns: [
                    { from: path.resolve(__dirname, "LICENSE"), },
                    { from: path.resolve(__dirname, "README.md"), },
                    { from: path.resolve(__dirname, "package.json"), },
                    { from: path.resolve(__dirname, "index.css"), }
                ],
            }),
            new CleanWebpackPlugin()
        ]
    };
}