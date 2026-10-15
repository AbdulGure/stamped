import {test} from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Native Node TypeScript requires an explicit extension.
import {resolveCloudConfig,safeNext} from '../lib/supabase/config.ts';
test('local mode is explicit and incomplete cloud config never falls back to demo',()=>{assert.equal(resolveCloudConfig(undefined,undefined,undefined).mode,'local');const config=resolveCloudConfig('cloud',undefined,undefined);assert.equal(config.mode,'cloud');assert.ok(config.error);});
test('secret and service role keys are rejected',()=>{assert.ok(resolveCloudConfig('cloud','https://test.supabase.co','sb_secret_x').error);const jwt=`e30.${btoa(JSON.stringify({role:'service_role'}))}.x`;assert.ok(resolveCloudConfig('cloud','https://test.supabase.co',jwt).error);assert.equal(resolveCloudConfig('cloud','https://test.supabase.co','sb_publishable_example').error,'');});
test('login redirects cannot escape this app',()=>{for(const next of ['//evil.com','/\\evil.com','https://evil.com','/auth/reset','/\nattack'])assert.equal(safeNext(next),'/plan');assert.equal(safeNext('/stamp/akihabara-electric-town'),'/stamp/akihabara-electric-town');});
