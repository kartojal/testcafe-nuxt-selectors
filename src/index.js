import { Selector } from 'testcafe';

export default Selector(complexSelector => {
    function validateSelector (selector) {
        if (selector !== void 0 && typeof selector !== 'string')
            throw new Error(`If the selector parameter is passed it should be a string, but it was ${typeof selector}`);
    }
    function findFirstRootInstance () {
        const instance = window.$nuxt.$root;

        return instance;
    }

    function getComponentTagNames (componentSelector) {
        return componentSelector
            .split(' ')
            .filter(el => !!el)
            .map(el => el.trim().toLowerCase());
    }

    function getComponentTags (instance) {
        const candidates = [
            instance.$options.name,
            instance.$options._name,
            instance.$options._componentTag,
            instance.$options.__file
        ];

        return candidates
            .filter((e) => e)
            .map((e) => e.toLowerCase());
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

        walkVueComponentNodes(root, 0, (node, tagIndex) => 
            getComponentTags(node).indexOf(tags[tagIndex]) !== -1
        );

        return foundComponents;
    }
    validateSelector(complexSelector);
    if (!window.$nuxt) return document.querySelectorAll(complexSelector);

    const rootInstance = findFirstRootInstance();

    if (!rootInstance) return null;

    if (!complexSelector) return rootInstance.$el;

    const componentTags = getComponentTagNames(complexSelector);

    return filterNodes(rootInstance, componentTags);
}).addCustomMethods({
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
            const props = instance._props || instance.$options.props;
            const getters =
          instance.$options.vuex && instance.$options.vuex.getters;
            const result = {};

            Object.keys(instance._data)
                .filter(
                    key => !(props && key in props) && !(getters && key in getters)
                )
                .forEach(key => {
                    result[key] = instance._data[key];
                });

            return result;
        }

        function getComputed (instance) {
            return getData(instance, instance.$options.computed || {});
        }

        const nodeVue = node.__vue__;

        if (!nodeVue) return null;

        const props = getProps(nodeVue);
        const state = getState(nodeVue);
        const computed = getComputed(nodeVue);

        if (typeof fn === 'function') return fn({ props, state, computed });

        return { props, state, computed };
    }
});
