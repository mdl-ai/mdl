import { workspace } from 'vscode';
import { homedir, tmpdir } from 'os';
import { join } from 'path';

const configuration = () => workspace.getConfiguration('mdl');

export const getBaseFile = () => configuration().get<string>('baseFile') || 'index.md';

export const getBasePath = () => configuration().get<string>('basePath') || join(homedir(), 'mdl');

export const getTempPath = () => configuration().get<string>('tempPath') || join(tmpdir(), 'mdl');

export const getOpenAIAPIKey = () => configuration().get<string>('openAIKey') || '';

export const getOpenAIOrganizationID = () => configuration().get<string>('openAIOrganizationID') || '';
