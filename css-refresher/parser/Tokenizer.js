// import { EventEmitter } from 'node:events';
import { AtRules, CharCode, nestedSelector, selectorStarter, State } from "../utils/css-enums.js";
import { EventEmitter } from "../utils/EventEmitter.js";

function isWhitespace(c) {
	return c === CharCode.Tab || c === CharCode.LineBreak || c === CharCode.Space;
}

export class Tokenizer extends EventEmitter {
	state = State.BeforeSelector;
	sectionStart = -1;
	index = -1;
	size = 0;
	offset = 0;

	constructor() {
		super();
	}

	parseError(code) {
		this.status = "error";
		console.error("expected character" + String.fromCharCode(code));
	}

	/** @param {number} code*/
	#fastForwardTo(code) {
		while (this.buffer.charCodeAt(++this.index) !== code)
			if (this.index === this.size) return this.parseError(code);
		return true;
	}

	#midBreakforwardUntil(code, midCode) {
		while (this.buffer.charCodeAt(++this.index) !== code) {
			if (this.index === this.size) return this.parseError(code);
			if (this.buffer.charCodeAt(this.index) === midCode) break;
		}
		return true;
	}

	#skipComment() {
		++this.index; //skip *
		this.#fastForwardTo(CharCode.Asterisk);
		if (!this.#isNextCode(CharCode.Slash)) return this.#skipComment();
		this.index = this.index + 2; //skip */
	}

	#checkAndSkipComment(code) {
		if (code === CharCode.Slash && this.#isNextCode(CharCode.Asterisk)) this.#skipComment();
		if (isWhitespace(this.buffer.charCodeAt(this.index))) return this.#skipWhitespace();
		return this.buffer.charCodeAt(this.index);
	}

	#skipWhitespace() {
		while (++this.index < this.size) {
			const code = this.buffer.charCodeAt(this.index);
			if (code !== CharCode.LineBreak && code !== CharCode.Tab && code !== CharCode.Space) break;
		}

		return this.buffer.charCodeAt(this.index);
	}

	/** @param {string} evtName */
	#emitData(evtName, ...args) {
		const data = this.buffer.slice(this.sectionStart, this.index);
		this.emit(evtName, data, this.sectionStart + this.offset, this.index + this.offset, args);
		//console.log(evtName, this.buffer.slice(this.sectionStart, this.index));
	}

	validTagName() {
		let sectionStart = this.index;
		return true;
	}

	#isNextCode(code) {
		return this.buffer.charCodeAt(this.index + 1) === code;
	}

	#stateBeforeAtRuleBlock() {
		this.sectionStart = this.index;
		this.#fastForwardTo(CharCode.Space);
		const atRule = this.buffer.slice(this.sectionStart, this.index);
		if (AtRules[atRule]) {
			this.sectionStart = this.index + 1;
			this.#stateInAtRuleBlock(atRule);
		}
	}

	#stateInAtRuleBlock(atRule) {
		atRule !== "layer"
			? this.#fastForwardTo(CharCode.openingCurly)
			: this.#midBreakforwardUntil(CharCode.openingCurly, CharCode.SemiColon);
		this.#emitData("openrule", atRule);
		this.state = State.BeforeSelector;
	}

	#stateCloseDeclarationBlock(code) {
		isWhitespace(code) && (code = this.#skipWhitespace());
		if (code === CharCode.closingCurly) {
			this.state = State.BeforeSelector;
			return this.#emitData("closerule");
		}
		isWhitespace(code) && (code = this.#skipWhitespace());
		if (code === CharCode.Amp) this.state = State.BeforeNestedSelector;
		else {
			this.state = State.BeforeSelector;
			this.#stateBeforeSelector(this.buffer.charCodeAt(this.index));
		}
	}

	#stateInDeclarationBlock(code) {
		isWhitespace(code) && (code = this.#skipWhitespace());
		code = this.#checkAndSkipComment(code);
		if (code === CharCode.Amp) return (this.state = State.BeforeNestedSelector);
		if (code === CharCode.closingCurly) {
			this.state = State.CloseDeclarationBlock;
			return this.#emitData("closerule");
		}

		this.sectionStart = this.index;
		this.#fastForwardTo(CharCode.Colon);
		this.#emitData("addproperty");

		this.#isNextCode(CharCode.Space) ? (this.index = this.index + 2) : ++this.index;
		this.sectionStart = this.index;
		this.#fastForwardTo(CharCode.SemiColon);
		this.#emitData("declaration");
		this.sectionStart = -1;
		this.#isNextCode(CharCode.LineBreak) && ++this.index;
	}

	#stateInSelector() {
		this.#fastForwardTo(CharCode.openingCurly);
		this.#emitData("openrule");
		this.state = State.InDeclarationBlock;
	}

	#stateBeforeNestedSelector(code) {
		this.#isNextCode(CharCode.Space) && (code = this.buffer.charCodeAt(this.index + 1));

		if (nestedSelector.has(code)) {
			this.sectionStart = this.index - 1; //include  &
			this.#fastForwardTo(CharCode.openingCurly);
			this.#emitData("openrule");
			this.state = State.InDeclarationBlock;
		} else if (this.validTagName()) {
			this.state = State.InSelector;
			this.sectionStart = this.index - 1; //include  &
		}
	}

	#stateBeforeSelector(code) {
		isWhitespace(code) && (code = this.#skipWhitespace());
		code = this.#checkAndSkipComment(code);

		if (code === CharCode.Amp) return (this.state = State.BeforeNestedSelector);
		if (selectorStarter.has(code)) {
			this.state = State.InSelector;
			this.sectionStart = this.index;
		} else if (code === CharCode.At) {
			this.state = State.BeforeAtRuleBlock;
			this.sectionStart = this.index;
		} else if (this.validTagName()) {
			this.state = State.InSelector;
			this.sectionStart = this.index;
		}
	}

	allStates = {
		[State.BeforeSelector]: this.#stateBeforeSelector,
		[State.InSelector]: this.#stateInSelector,
		[State.BeforeAtRuleBlock]: this.#stateBeforeAtRuleBlock,
		[State.InDeclarationBlock]: this.#stateInDeclarationBlock,
		[State.CloseDeclarationBlock]: this.#stateCloseDeclarationBlock,
		[State.BeforeNestedSelector]: this.#stateBeforeNestedSelector,
	};

	/**@param {string} buffer*/
	consume(buffer, offset = 0) {
		this.buffer = buffer;
		this.size = buffer.length;
		this.offset = offset;
		this.status = "processing";

		while (++this.index < this.size) {
			const code = this.buffer.charCodeAt(this.index);
			this.allStates[this.state].call(this, code);
		}

		//rest after finish
		this.buffer = null;
		this.index = -1;
		this.state = State.BeforeSelector;
		return this.status !== "error";
	}
}
