const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function git(cwd, ...args) {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
}
function fixture(run) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gacha-upload-'));
    try { git(dir, 'init', '--quiet'); run(dir); }
    finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
test('website allows runtime resources and excludes development and archived metadata', () => fixture(dir => {
    fs.copyFileSync(path.join(root, '.assetsignore'), path.join(dir, '.gitignore'));
    for (const name of ['html/index.html', 'img/TEST/icon.webp', 'Preset_Data/db_test.js', 'old_version/0.1/index.html', '_redirects']) {
        assert.equal(spawnSync('git', ['check-ignore', '--no-index', name], { cwd: dir }).status, 1, name);
    }
    for (const name of ['dev/tests/a.cjs', 'docs/a.md', 'upload.bat', '.wrangler/a.json', '.env', 'unknown/a.txt', 'old_version/0.2/tests/a.cjs', 'old_version/0.2/.env', 'Preset_Data/spec.md']) {
        assert.equal(spawnSync('git', ['check-ignore', '--no-index', name], { cwd: dir }).status, 0, name);
    }
}));

test('Cloudflare batch scripts run with mocked npx, without publishing', { skip: process.platform !== 'win32' }, () => fixture(dir => {
    fs.mkdirSync(path.join(dir, 'html'));
    fs.writeFileSync(path.join(dir, 'html/index.html'), 'fixture');
    fs.writeFileSync(path.join(dir, '.assetsignore'), '*');
    fs.writeFileSync(path.join(dir, 'wrangler.jsonc'), '{}');
    // The working-directory stub intercepts npx; no real deploy command is run.
    fs.writeFileSync(path.join(dir, 'npx.cmd'), '@echo off\r\necho MOCK_NPX %*\r\nexit /b %MOCK_RESULT%\r\n');
    for (const script of ['upload.bat', 'upload_test.bat']) {
        fs.copyFileSync(path.join(root, script), path.join(dir, script));
        for (const code of [0, 7]) {
            const result = spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', script], {
                cwd: dir, encoding: 'utf8', input: '\r\n', timeout: 10000,
                env: { ...process.env, MOCK_RESULT: String(code), PATH: dir + ';' + path.join(process.env.SystemRoot, 'System32') }
            });
            assert.equal(result.status, code, result.stdout + result.stderr);
            assert.equal(result.stderr, '');
            assert.ok(result.stdout.includes('MOCK_NPX wrangler deploy --config wrangler.jsonc' + (script === 'upload_test.bat' ? ' --env test' : '')));
            assert.ok(result.stdout.includes(code === 0 ? '[成功]' : '[失败]'));
        }
    }
}));
test('GitHub keeps reusable files; cleanup untracks ignored files without deleting local copies', { skip: process.platform !== 'win32' }, () => fixture(dir => {
    fs.mkdirSync(path.join(dir, 'dev/tools'), { recursive: true });
    fs.copyFileSync(path.join(root, 'dev/tools/untrack_ignored.ps1'), path.join(dir, 'dev/tools/untrack_ignored.ps1'));
    const ignored = ['.wrangler/cache.json', 'dev/output/中文 空格.txt', 'dev/local/backup.txt', '.env'];
    for (const file of ignored) {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        fs.writeFileSync(path.join(dir, file), 'local fixture');
    }
    git(dir, 'add', '.');
    fs.copyFileSync(path.join(root, '.gitignore'), path.join(dir, '.gitignore'));
    const result = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(dir, 'dev/tools/untrack_ignored.ps1')], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const tracked = git(dir, 'ls-files', '-z').split('\0');
    for (const file of ignored) {
        assert.ok(!tracked.includes(file), file);
        assert.ok(fs.existsSync(path.join(dir, file)), file);
    }
    for (const file of ['docs/agent_rule/upload.md', 'dev/tools/preview.cjs', 'dev/tests/a.cjs', 'upload.bat', 'wrangler.jsonc', 'old_version/0.1/index.html']) {
        assert.equal(spawnSync('git', ['check-ignore', '--no-index', file], { cwd: dir }).status, 1, file);
    }
}));
