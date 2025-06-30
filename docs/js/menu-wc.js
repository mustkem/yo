'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">twitter-backend-node documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/ApiModule.html" data-type="entity-link" >ApiModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' : 'data-target="#xs-controllers-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' :
                                            'id="xs-controllers-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' : 'data-target="#xs-injectables-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' :
                                        'id="xs-injectables-links-module-AppModule-3c4dabc271dac26bcda1ec9b78d29991846e70e9a9693ebb262bd020df8733f8938e2ac2554cf145073022913c47efa5a30a8c2d12312b5b59a2bc08c965bcc2"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' : 'data-target="#xs-controllers-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' :
                                            'id="xs-controllers-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' : 'data-target="#xs-injectables-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' :
                                        'id="xs-injectables-links-module-AuthModule-0f61a15a1da03a136e406fc74a4f69723b0804295a70d61054d7786edf2b711a718ce2f7b58e17078cb6b4a41520b7f86b60608a8eae7d22fc5465c67a62c837"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/HashtagsModule.html" data-type="entity-link" >HashtagsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-HashtagsModule-290fb8ffa257b1c5df093d91753cb1bfac5fbbce201ae4cedaf4e612f71c63fb110f5bbfa9573c2e91ca5b38e7dbcc76f7cc80e3c28705b3b1ac67969c266ca4"' : 'data-target="#xs-controllers-links-module-HashtagsModule-290fb8ffa257b1c5df093d91753cb1bfac5fbbce201ae4cedaf4e612f71c63fb110f5bbfa9573c2e91ca5b38e7dbcc76f7cc80e3c28705b3b1ac67969c266ca4"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-HashtagsModule-290fb8ffa257b1c5df093d91753cb1bfac5fbbce201ae4cedaf4e612f71c63fb110f5bbfa9573c2e91ca5b38e7dbcc76f7cc80e3c28705b3b1ac67969c266ca4"' :
                                            'id="xs-controllers-links-module-HashtagsModule-290fb8ffa257b1c5df093d91753cb1bfac5fbbce201ae4cedaf4e612f71c63fb110f5bbfa9573c2e91ca5b38e7dbcc76f7cc80e3c28705b3b1ac67969c266ca4"' }>
                                            <li class="link">
                                                <a href="controllers/HashtagsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HashtagsController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LikesModule.html" data-type="entity-link" >LikesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' : 'data-target="#xs-controllers-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' :
                                            'id="xs-controllers-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' }>
                                            <li class="link">
                                                <a href="controllers/LikesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LikesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' : 'data-target="#xs-injectables-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' :
                                        'id="xs-injectables-links-module-LikesModule-094ee1683254160432e858334cec0452372a13f45eb35125dbbcbd728be8ad05ee620bd398ddcd261634f1307c0b83f4f9467bb7aa317ebef9287244000669e6"' }>
                                        <li class="link">
                                            <a href="injectables/LikesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LikesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MockLikesModule.html" data-type="entity-link" >MockLikesModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-MockLikesModule-2fd4d9e14b6eafa10a2b64b1490a6b0f503d73bfcc72b6e750100d6f72f3020011138bc298b7eabf73d0366e099ff8bb892fe5f1bb532fe9b47584f1cfd54d5a"' : 'data-target="#xs-injectables-links-module-MockLikesModule-2fd4d9e14b6eafa10a2b64b1490a6b0f503d73bfcc72b6e750100d6f72f3020011138bc298b7eabf73d0366e099ff8bb892fe5f1bb532fe9b47584f1cfd54d5a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MockLikesModule-2fd4d9e14b6eafa10a2b64b1490a6b0f503d73bfcc72b6e750100d6f72f3020011138bc298b7eabf73d0366e099ff8bb892fe5f1bb532fe9b47584f1cfd54d5a"' :
                                        'id="xs-injectables-links-module-MockLikesModule-2fd4d9e14b6eafa10a2b64b1490a6b0f503d73bfcc72b6e750100d6f72f3020011138bc298b7eabf73d0366e099ff8bb892fe5f1bb532fe9b47584f1cfd54d5a"' }>
                                        <li class="link">
                                            <a href="injectables/LikesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LikesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MockPostsModule.html" data-type="entity-link" >MockPostsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-MockPostsModule-453aa85fbb1d04e9ec05720abe5d05b0a9ff35c3a3565cb31e05ebb3c67d5035ae2e28d1ce1157a093cedcc841035470a2bb09891a12af8d65320a5e4d00d746"' : 'data-target="#xs-injectables-links-module-MockPostsModule-453aa85fbb1d04e9ec05720abe5d05b0a9ff35c3a3565cb31e05ebb3c67d5035ae2e28d1ce1157a093cedcc841035470a2bb09891a12af8d65320a5e4d00d746"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MockPostsModule-453aa85fbb1d04e9ec05720abe5d05b0a9ff35c3a3565cb31e05ebb3c67d5035ae2e28d1ce1157a093cedcc841035470a2bb09891a12af8d65320a5e4d00d746"' :
                                        'id="xs-injectables-links-module-MockPostsModule-453aa85fbb1d04e9ec05720abe5d05b0a9ff35c3a3565cb31e05ebb3c67d5035ae2e28d1ce1157a093cedcc841035470a2bb09891a12af8d65320a5e4d00d746"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LikesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LikesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PostsModule.html" data-type="entity-link" >PostsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' : 'data-target="#xs-controllers-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' :
                                            'id="xs-controllers-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' }>
                                            <li class="link">
                                                <a href="controllers/PostsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PostsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' : 'data-target="#xs-injectables-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' :
                                        'id="xs-injectables-links-module-PostsModule-28659dcf57f40e089228ada68341170ee40e565d9e69c3200241372958a4f04e17d06ad5f0b88452b530f584f81c7421ceb93bc8beceae9d7ac244e4233bc874"' }>
                                        <li class="link">
                                            <a href="injectables/PostsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PostsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProdDbModule.html" data-type="entity-link" >ProdDbModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TestDbModule.html" data-type="entity-link" >TestDbModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link" >UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' : 'data-target="#xs-controllers-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' :
                                            'id="xs-controllers-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' : 'data-target="#xs-injectables-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' :
                                        'id="xs-injectables-links-module-UsersModule-9d06fd54fb97ca64df057fb678442e3eea11fb7e56cc0c2e36e7cfc7449be59b25e5739db738e9d377d219886b89d14c8142c529ccf78b434ba2265f8e771e15"' }>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/LikesEntity.html" data-type="entity-link" >LikesEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/LikesRepository.html" data-type="entity-link" >LikesRepository</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginRequestBody.html" data-type="entity-link" >LoginRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginResponseBody.html" data-type="entity-link" >LoginResponseBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/Mention.html" data-type="entity-link" >Mention</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockLikesRepository.html" data-type="entity-link" >MockLikesRepository</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockPostsRepository.html" data-type="entity-link" >MockPostsRepository</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockUsersRepository.html" data-type="entity-link" >MockUsersRepository</a>
                            </li>
                            <li class="link">
                                <a href="classes/PasswordEntity.html" data-type="entity-link" >PasswordEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/PostCreateRequestBody.html" data-type="entity-link" >PostCreateRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/PostDetailsQueryParams.html" data-type="entity-link" >PostDetailsQueryParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PostEntity.html" data-type="entity-link" >PostEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/PostsRepository.html" data-type="entity-link" >PostsRepository</a>
                            </li>
                            <li class="link">
                                <a href="classes/SessionsEntity.html" data-type="entity-link" >SessionsEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/TokenAuthorizer.html" data-type="entity-link" >TokenAuthorizer</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserCreateRequestBody.html" data-type="entity-link" >UserCreateRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserEntity.html" data-type="entity-link" >UserEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserFollowingEntity.html" data-type="entity-link" >UserFollowingEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/UsersRepository.html" data-type="entity-link" >UsersRepository</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserUpdateRequestBody.html" data-type="entity-link" >UserUpdateRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/YooBaseEntity.html" data-type="entity-link" >YooBaseEntity</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#guards-links"' :
                            'data-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/OptionalAuthGuard.html" data-type="entity-link" >OptionalAuthGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/RequiredAuthGuard.html" data-type="entity-link" >RequiredAuthGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});