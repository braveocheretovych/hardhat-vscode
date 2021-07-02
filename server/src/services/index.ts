import { Analyzer } from "../../../parser";

import { SolidityNavigation } from './SolidityNavigation';
import { SolidityCompletion } from './SolidityCompletion';

export class LanguageService {
	analyzer: Analyzer;
	solidityNavigation: SolidityNavigation;
	solidityCompletion: SolidityCompletion;

	constructor(rootPath: string) {
		this.analyzer = new Analyzer(rootPath);
		this.solidityNavigation = new SolidityNavigation();
		this.solidityCompletion = new SolidityCompletion();
	}
}
