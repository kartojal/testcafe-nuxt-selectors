import { Selector } from 'testcafe';

export default (selector) => {
    if (selector !== void 0 && typeof selector !== 'string')
        throw new Error(`If the selector parameter is passed it should be a string, but it was ${typeof selector}`);

    return Selector(complexSelector => {
        function findFirstRootInstance () {
            let instance     = null;
            const treeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT, () => NodeFilter.FILTER_ACCEPT, false);
            let currentNode  = treeWalker.nextNode();

            while (currentNode) {
                instance = currentNode.__vue__;

                if (instance)
                    break;

                currentNode = treeWalker.nextNode();
            }

            return instance;
        }

        function getComponentTagNames (componentSelector) {
            return componentSelector
                .split(' ')
                .filter(el => !!el)
                .map(el => el.trim().toLowerCase());
        }

        function getComponentTag (instance) {
            return instance.$options.name ||
                   instance.$options._componentTag ||
                   instance.$options.__file ||
                   '';
        }

        function filterNodes (root, tags) {
            const foundComponents = [];

            function walkVueComponentNodes (node, tagIndex, checkFn) {
                if (checkFn(node, tagIndex)) {
                    if (tagIndex === tags.length - 1) {
                        foundComponents.push(node.$el);
                        return;
                    }

                    tagIndex++;
                }

                for (let i = 0; i < node.$children.length; i++) {
                    const childNode = node.$children[i];

                    walkVueComponentNodes(childNode, tagIndex, checkFn);
                }
            }

            walkVueComponentNodes(root, 0, (node, tagIndex) => tags[tagIndex] === getComponentTag(node));

            return foundComponents;
        }

        if (!window.$nuxt)
            return document.querySelectorAll(complexSelector);

        const rootInstance = findFirstRootInstance();

        if (!rootInstance)
            return null;

        if (!complexSelector)
            return rootInstance.$el;

        const componentTags = getComponentTagNames(complexSelector);

        return filterNodes(rootInstance, componentTags);
    })(selector).addCustomMethods({
        getVue: (node, fn) => {
            function getData (instance, prop) {
                const result = {};

                Object.keys(prop).forEach(key => {
                    result[key] = instance[key];
                });


                return result;
            }

            function getProps (instance) {
                return getData(instance, instance.$options.props || {});
            }

            function getState (instance) {
                const props   = instance._props || instance.$options.props;
                const getters = instance.$options.vuex && instance.$options.vuex.getters;
                const result  = {};

                Object.keys(instance._data)
                    .filter(key => !(props && key in props) && !(getters && key in getters))
                    .forEach(key => {
                        result[key] = instance._data[key];
                    });

                return result;
            }

            function getComputed (instance) {
                return getData(instance, instance.$options.computed || {});
            }

            const nodeVue = node.__vue__;

            if (!nodeVue)
                return null;

            const props    = getProps(nodeVue);
            const state    = getState(nodeVue);
            const computed = getComputed(nodeVue);

            if (typeof fn === 'function')
                return fn({ props, state, computed });

            return { props, state, computed };
        }
    });
};

