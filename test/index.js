import { ClientFunction } from 'testcafe';
import VueSelector from '../lib';

fixture`VueSelector`
  .page('http://localhost:8080')
  /* Wait to root element to appear in each test */
  .beforeEach(async () => await VueSelector());

test('Nuxt is root node', async t => {
    const root = VueSelector();
    const rootVue = await root.getVue();

    await t.expect(root.exists).ok();
    await t.expect(rootVue.state.layoutName).eql('default');
});

test('Vue selector should pick component', async t => {
    const list = VueSelector('list');
  /*
        Seems more consistent to get a DOM Snapshot with
        await VueSelector, and them get vue properties
        with ElementSnapshot.getVue().
        
        Otherwise, it fails sometimes so there is no consistency
        between tests, maybe Vue/Nuxt were not "ready".
    */
    const listSnapshot = await list();
    const listVue = await listSnapshot.getVue();

    await t
    .expect(list.count)
    .eql(2)
    .expect(VueSelector('list-item').count)
    .eql(6);
    await t.expect(listVue.props.id).eql('list1');
    await t.expect(listVue.computed.reversedId).eql('1tsil');
});

test('Vue composite selector should pick children component', async t => {
    const listItem = VueSelector('list list-item');
    const listItemSnapshot = await listItem().nth(5);
    const listItemVue6 = await listItemSnapshot.getVue();
    const listItemVue5Id = listItem.nth(4).getVue(({ props }) => props.id);

    await t
    .expect(listItem.count)
    .eql(6)
    .expect(listItemVue6.props.id)
    .eql('list2-item3')
    .expect(listItemVue5Id)
    .eql('list2-item2');
});

test('Should throw exception for non-valid selectors', async t => {
    for (const selector of [null, false, {}, 42]) {
        try {
            VueSelector(selector);
        }
        catch (e) {
            await t
        .expect(e.message)
        .eql(
          `If the selector parameter is passed it should be a string, but it was ${typeof selector}`
        );
        }
    }
});

test('There is no Nuxt app on the tested page', async t => {
    await ClientFunction(() => window.$nuxt = null)();

    const body = await VueSelector('body');

    await t.expect(body.tagName).eql('body');
});
