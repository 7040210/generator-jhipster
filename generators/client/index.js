/**
 * Copyright 2013-2020 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable consistent-return */
const chalk = require('chalk');
const _ = require('lodash');
const BaseBlueprintGenerator = require('../generator-base-blueprint');
const prompts = require('./prompts');
const writeAngularFiles = require('./files-angular').writeFiles;
const writeReactFiles = require('./files-react').writeFiles;
const packagejs = require('../../package.json');
const constants = require('../generator-constants');
const statistics = require('../statistics');

let useBlueprints;

module.exports = class extends BaseBlueprintGenerator {
    constructor(args, opts) {
        super(args, opts);

        this.configOptions = this.options.configOptions || {};
        // This adds support for a `--from-cli` flag
        this.option('from-cli', {
            desc: 'Indicates the command is run from JHipster CLI',
            type: Boolean,
            defaults: false
        });
        // This adds support for a `--auth` flag
        this.option('auth', {
            desc: 'Provide authentication type for the application',
            type: String
        });

        // This adds support for a `--skip-commit-hook` flag
        this.option('skip-commit-hook', {
            desc: 'Skip adding husky commit hooks',
            type: Boolean,
            defaults: false
        });

        // This adds support for a `--experimental` flag which can be used to enable experimental features
        this.option('experimental', {
            desc:
                'Enable experimental features. Please note that these features may be unstable and may undergo breaking changes at any time',
            type: Boolean,
            defaults: false
        });

        this.setupClientOptions(this);

        useBlueprints = !opts.fromBlueprint && this.instantiateBlueprints('client');
    }

    // Public API method used by the getter and also by Blueprints
    _initializing() {
        return {
            validateFromCli() {
                this.checkInvocationFromCLI();
            },

            displayLogo() {
                if (this.logo) {
                    this.printJHipsterLogo();
                }
            },

            setupClientconsts() {
                // Make constants available in templates
                this.MAIN_SRC_DIR = constants.CLIENT_MAIN_SRC_DIR;
                this.TEST_SRC_DIR = constants.CLIENT_TEST_SRC_DIR;
                const configuration = this.getAllJhipsterConfig(this, true);
                this.serverPort = configuration.get('serverPort') || this.configOptions.serverPort || 8080;
                this.applicationType = configuration.get('applicationType') || this.configOptions.applicationType;
                if (!this.applicationType) {
                    this.applicationType = 'monolith';
                }
                this.clientFramework = configuration.get('clientFramework');
                if (!this.clientFramework) {
                    /* for backward compatibility */
                    this.clientFramework = 'angularX';
                }
                if (this.clientFramework === 'angular' || this.clientFramework === 'angular2') {
                    /* for backward compatibility */
                    this.clientFramework = 'angularX';
                }

                this.clientTheme = configuration.get('clientTheme');
                if (!this.clientTheme) {
                    this.clientTheme = 'none';
                }
                this.clientThemeVariant = configuration.get('clientThemeVariant');

                this.enableTranslation = configuration.get('enableTranslation'); // this is enabled by default to avoid conflicts for existing applications
                this.nativeLanguage = configuration.get('nativeLanguage');
                this.languages = configuration.get('languages');
                this.enableI18nRTL = this.isI18nRTLSupportNecessary(this.languages);
                this.messageBroker = configuration.get('messageBroker');
                this.packagejs = packagejs;
                const baseName = configuration.get('baseName');
                if (baseName) {
                    this.baseName = baseName;
                }

                this.serviceDiscoveryType =
                    configuration.get('serviceDiscoveryType') === 'no'
                        ? false
                        : configuration.get('serviceDiscoveryType') || this.configOptions.serviceDiscoveryType;
                if (this.serviceDiscoveryType === undefined) {
                    this.serviceDiscoveryType = false;
                }

                const clientConfigFound = this.enableTranslation !== undefined;
                if (clientConfigFound) {
                    // If translation is not defined, it is enabled by default
                    if (this.enableTranslation === undefined) {
                        this.enableTranslation = true;
                    }
                    if (this.nativeLanguage === undefined) {
                        this.nativeLanguage = 'en';
                    }
                    if (this.languages === undefined) {
                        this.languages = ['en', 'fr'];
                    }

                    this.existingProject = true;
                }
                this.useNpm = this.configOptions.useNpm = !this.options.yarn;
                this.useYarn = !this.useNpm;
                if (!this.clientPackageManager) {
                    if (this.useNpm) {
                        this.clientPackageManager = 'npm';
                    } else {
                        this.clientPackageManager = 'yarn';
                    }
                }
            },

            validateSkipServer() {
                if (this.skipServer && !(this.databaseType && this.devDatabaseType && this.prodDatabaseType && this.authenticationType)) {
                    this.error(
                        `When using skip-server flag, you must pass a database option and authentication type using ${chalk.yellow(
                            '--db'
                        )} and ${chalk.yellow('--auth')} flags`
                    );
                }
                if (this.skipServer && this.authenticationType === 'uaa' && !this.uaaBaseName) {
                    this.error(
                        `When using skip-server flag and UAA as authentication method, you must pass a UAA base name using ${chalk.yellow(
                            '--uaa-base-name'
                        )} flag`
                    );
                }
            }
        };
    }

    get initializing() {
        if (useBlueprints) return;
        return this._initializing();
    }

    // Public API method used by the getter and also by Blueprints
    _prompting() {
        return {
            askForModuleName: prompts.askForModuleName,
            askForClient: prompts.askForClient,
            askFori18n: prompts.askFori18n,
            askForClientTheme: prompts.askForClientTheme,
            askForClientThemeVariant: prompts.askForClientThemeVariant,

            setSharedConfigOptions() {
                this.configOptions.skipClient = this.skipClient;
                this.configOptions.clientFramework = this.clientFramework;
                this.configOptions.clientTheme = this.clientTheme;
                this.configOptions.clientThemeVariant = this.clientThemeVariant;
            }
        };
    }

    get prompting() {
        if (useBlueprints) return;
        return this._prompting();
    }

    // Public API method used by the getter and also by Blueprints
    _configuring() {
        return {
            insight() {
                statistics.sendSubGenEvent('generator', 'client', {
                    app: {
                        clientFramework: this.clientFramework,
                        enableTranslation: this.enableTranslation,
                        nativeLanguage: this.nativeLanguage,
                        languages: this.languages
                    }
                });
            },

            configureGlobal() {
                // Application name modified, using each technology's conventions
                this.camelizedBaseName = _.camelCase(this.baseName);
                this.angularAppName = this.getAngularAppName();
                this.angularXAppName = this.getAngularXAppName();
                this.hipster = this.getHipster(this.baseName);
                this.capitalizedBaseName = _.upperFirst(this.baseName);
                this.dasherizedBaseName = _.kebabCase(this.baseName);
                this.lowercaseBaseName = this.baseName.toLowerCase();
                if (!this.nativeLanguage) {
                    // set to english when translation is set to false
                    this.nativeLanguage = 'en';
                }
            },

            saveConfig() {
                const config = {
                    jhipsterVersion: packagejs.version,
                    applicationType: this.applicationType,
                    baseName: this.baseName,
                    useSass: true,
                    enableTranslation: this.enableTranslation,
                    skipCommitHook: this.skipCommitHook,
                    clientPackageManager: this.clientPackageManager
                };
                if (this.skipClient) {
                    config.skipClient = true;
                } else {
                    config.clientFramework = this.clientFramework;
                    config.clientTheme = this.clientTheme;
                    config.clientThemeVariant = this.clientThemeVariant;
                }
                if (this.enableTranslation && !this.configOptions.skipI18nQuestion) {
                    config.nativeLanguage = this.nativeLanguage;
                    config.languages = this.languages;
                }
                if (this.skipServer) {
                    this.authenticationType && (config.authenticationType = this.authenticationType);
                    this.uaaBaseName && (config.uaaBaseName = this.uaaBaseName);
                    this.cacheProvider && (config.cacheProvider = this.cacheProvider);
                    this.enableHibernateCache && (config.enableHibernateCache = this.enableHibernateCache);
                    this.websocket && (config.websocket = this.websocket);
                    this.databaseType && (config.databaseType = this.databaseType);
                    this.devDatabaseType && (config.devDatabaseType = this.devDatabaseType);
                    this.prodDatabaseType && (config.prodDatabaseType = this.prodDatabaseType);
                    this.searchEngine && (config.searchEngine = this.searchEngine);
                    this.buildTool && (config.buildTool = this.buildTool);
                }
                this.config.set(config);
            }
        };
    }

    get configuring() {
        if (useBlueprints) return;
        return this._configuring();
    }

    // Public API method used by the getter and also by Blueprints
    _default() {
        return {
            getSharedConfigOptions() {
                if (this.configOptions.cacheProvider) {
                    this.cacheProvider = this.configOptions.cacheProvider;
                }
                if (this.configOptions.enableHibernateCache) {
                    this.enableHibernateCache = this.configOptions.enableHibernateCache;
                }
                if (this.configOptions.websocket !== undefined) {
                    this.websocket = this.configOptions.websocket;
                }
                if (this.configOptions.clientFramework) {
                    this.clientFramework = this.configOptions.clientFramework;
                }
                if (this.configOptions.databaseType) {
                    this.databaseType = this.configOptions.databaseType;
                }
                if (this.configOptions.devDatabaseType) {
                    this.devDatabaseType = this.configOptions.devDatabaseType;
                }
                if (this.configOptions.prodDatabaseType) {
                    this.prodDatabaseType = this.configOptions.prodDatabaseType;
                }
                if (this.configOptions.messageBroker !== undefined) {
                    this.messageBroker = this.configOptions.messageBroker;
                }
                if (this.configOptions.searchEngine !== undefined) {
                    this.searchEngine = this.configOptions.searchEngine;
                }
                if (this.configOptions.buildTool) {
                    this.buildTool = this.configOptions.buildTool;
                }
                if (this.configOptions.authenticationType) {
                    this.authenticationType = this.configOptions.authenticationType;
                }
                if (this.configOptions.otherModules) {
                    this.otherModules = this.configOptions.otherModules;
                }
                if (this.configOptions.testFrameworks) {
                    this.testFrameworks = this.configOptions.testFrameworks;
                }
                this.protractorTests = this.testFrameworks.includes('protractor');

                if (this.configOptions.enableTranslation !== undefined) {
                    this.enableTranslation = this.configOptions.enableTranslation;
                }
                if (this.configOptions.nativeLanguage !== undefined) {
                    this.nativeLanguage = this.configOptions.nativeLanguage;
                }
                if (this.configOptions.languages !== undefined) {
                    this.languages = this.configOptions.languages;
                    this.enableI18nRTL = this.isI18nRTLSupportNecessary(this.languages);
                }

                if (this.configOptions.uaaBaseName !== undefined) {
                    this.uaaBaseName = this.configOptions.uaaBaseName;
                }

                // Make dist dir available in templates
                this.BUILD_DIR = this.getBuildDirectoryForBuildTool(this.configOptions.buildTool);

                this.styleSheetExt = 'scss';
                this.pkType = this.getPkType(this.databaseType);
                this.apiUaaPath = `${this.authenticationType === 'uaa' ? `services/${this.uaaBaseName.toLowerCase()}/` : ''}`;
                this.DIST_DIR = this.getResourceBuildDirectoryForBuildTool(this.configOptions.buildTool) + constants.CLIENT_DIST_DIR;
                this.AOT_DIR = `${this.getResourceBuildDirectoryForBuildTool(this.configOptions.buildTool)}aot`;
                this.CLIENT_MAIN_SRC_DIR = constants.CLIENT_MAIN_SRC_DIR;
            },

            composeLanguages() {
                if (this.configOptions.skipI18nQuestion) return;

                this.composeLanguagesSub(this, this.configOptions, 'client');
            }
        };
    }

    get default() {
        if (useBlueprints) return;
        return this._default();
    }

    // Public API method used by the getter and also by Blueprints
    _writing() {
        return {
            write() {
                if (this.skipClient) return;
                switch (this.clientFramework) {
                    case 'react':
                        return writeReactFiles.call(this, useBlueprints);
                    default:
                        return writeAngularFiles.call(this, useBlueprints);
                }
            }
        };
    }

    get writing() {
        if (useBlueprints) return;
        return this._writing();
    }

    // Public API method used by the getter and also by Blueprints
    _install() {
        return {
            installing() {
                if (this.skipClient) return;
                const logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

                const installConfig = {
                    bower: false,
                    npm: this.clientPackageManager !== 'yarn',
                    yarn: this.clientPackageManager === 'yarn'
                };

                if (this.options['skip-install']) {
                    this.log(logMsg);
                } else {
                    try {
                        this.installDependencies(installConfig);
                    } catch (e) {
                        this.warning('Install of dependencies failed!');
                        this.log(logMsg);
                    }
                }
            }
        };
    }

    get install() {
        if (useBlueprints) return;
        return this._install();
    }

    // Public API method used by the getter and also by Blueprints
    _end() {
        return {
            end() {
                if (this.skipClient) return;
                this.log(chalk.green.bold('\nClient application generated successfully.\n'));

                const logMsg = `Start your Webpack development server with:\n ${chalk.yellow.bold(`${this.clientPackageManager} start`)}\n`;

                this.log(chalk.green(logMsg));
                if (!this.options['skip-install']) {
                    this.spawnCommandSync(this.clientPackageManager, ['run', 'cleanup']);
                }
            }
        };
    }

    get end() {
        if (useBlueprints) return;
        return this._end();
    }
};
