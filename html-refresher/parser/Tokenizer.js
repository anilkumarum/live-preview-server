import { CharCode, QuoteType, Sequence, State } from "../utils/html-enums.js";
import { EventEmitter } from "../utils/EventEmitter.js";

function isWhitespace(code) {
	return code === CharCode.Space || code === CharCode.LineBreak || code === CharCode.Tab;
}

function isEndOfTagSection(code) {
	return code === CharCode.Slash || code === CharCode.Gt || isWhitespace(code);
}

export class Tokenizer extends EventEmitter {
	state = State.Text;
	sectionStart = -1;
	index = -1;
	size = 0;

	constructor() {
		super();
	}

	skipTillSequence(sequence) {
		const seqLength = sequence.length;
		const _sequence = [];

		while (++this.index < this.size) {
			const _count = _sequence.length;
			if (seqLength === _count) break;

			const code = this.buffer.charCodeAt(this.index);
			if (sequence[_count] === code) _sequence.push(code);
			else _sequence.length = 0;
		}
	}

	fastForwardTo(code) {
		while (this.buffer.charCodeAt(++this.index) !== code) if (this.index === this.size) break;
		return true;
	}

	/**@private @param {string} evtName */
	emitData(evtName) {
		const data = this.buffer.slice(this.sectionStart, this.index);
		this.emit(evtName, data, this.sectionStart + this.offset, this.index + this.offset);
	}

	stateAfterClosingTagName(code) {
		// Skip everything until ">"
		if (code === CharCode.Gt || this.fastForwardTo(CharCode.Gt)) {
			this.state = State.Text;
			this.sectionStart = this.index + 1;
		}
	}

	stateInClosingTagName(code) {
		if (code === CharCode.Gt || isWhitespace(code)) {
			this.emit("closeelem", this.index + this.offset);
			this.sectionStart = -1;
			this.state = State.AfterClosingTagName;
			this.stateAfterClosingTagName(code);
		}
	}

	stateBeforeClosingTagName(code) {
		if (isWhitespace(code)) return;
		if (code === CharCode.Gt) {
			this.state = State.Text;
		} else {
			this.state = State.InClosingTagName;
			this.sectionStart = this.index;
			//this.emit("closetagstart", this.index);
		}
	}

	stateInSelfClosingTag(code) {
		if (code === CharCode.Gt) {
			this.emit("selfcloseelem", this.index + this.offset);
			this.state = State.Text;
			this.sectionStart = this.index + 1;
			this.isSpecial = false;
		} else if (!isWhitespace(code)) {
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(code);
		}
	}

	handleInAttributeValue(code, quote) {
		if (code === quote || this.fastForwardTo(quote)) {
			this.emitData("attrvalue");
			this.sectionStart = -1;
			this.state = State.BeforeAttributeName;
		}
	}

	stateInAttributeValueDoubleQuotes(code) {
		this.handleInAttributeValue(code, CharCode.DoubleQuote);
	}

	stateInAttributeValueCurlyBraces(code) {
		this.handleInAttributeValue(code, QuoteType.curly);
	}

	stateBeforeAttributeValue(code) {
		if (code === CharCode.DoubleQuote) {
			this.state = State.InAttributeValueDq;
			this.sectionStart = this.index + 1;
		} else if (!isWhitespace(code)) {
			this.sectionStart = this.index;
			this.state = State.InAttributeValueNq;
			this.emitData("attrvalue");
			// stateInAttributeValueNoQuotes(c); // Reconsume token
		}
	}

	stateAfterAttributeName(code) {
		if (code === CharCode.Eq) {
			this.state = State.BeforeAttributeValue;
		} else if (code === CharCode.Slash || code === CharCode.Gt) {
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(code);
		} else if (!isWhitespace(code)) {
			this.state = State.InAttributeName;
			this.sectionStart = this.index;
		}
	}

	stateInAttributeName(code) {
		if (code === CharCode.Eq || isEndOfTagSection(code)) {
			this.emitData("attrname");
			this.sectionStart = -1;
			this.state = State.AfterAttributeName;
			this.stateAfterAttributeName(code);
		}
	}

	skipStyleScript() {
		const sectionStart = this.index - 5;
		if (this.buffer.charCodeAt(sectionStart + 1) === CharCode.LowerT) {
			this.skipTillSequence(Sequence.StyleTag);
			this.emitData("styleelem");
		} else if (this.buffer.charCodeAt(sectionStart + 1) === CharCode.LowerC) {
			this.skipTillSequence(Sequence.ScriptTag);
		}
		this.sectionStart = -1;
		this.state = State.Text;
	}

	stateBeforeAttributeName(code) {
		if (code === CharCode.Gt) {
			this.state = State.Text;
			this.sectionStart = this.index + 1;
			//tag is style or script tag
			if (this.buffer.charCodeAt(this.index - 5) === CharCode.LowerS) this.skipStyleScript();
		} else if (code === CharCode.Slash) {
			this.state = State.InSelfClosingTag;
		} else if (!isWhitespace(code)) {
			this.state = State.InAttributeName;
			this.sectionStart = this.index;
		}
	}

	stateInTagName(code) {
		if (isEndOfTagSection(code)) {
			this.emitData("openelem");
			this.sectionStart = -1;
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(code);
		}
	}

	stateBeforeTagName(code) {
		if (code === CharCode.Slash) {
			this.state = State.BeforeClosingTagName;
		} else if (code === CharCode.ExclamationMark) {
			code = this.buffer.charCodeAt(++this.index);
			if (code === CharCode.UpperD) this.fastForwardTo(CharCode.Gt);
			else if (code === CharCode.Dash) this.skipTillSequence(Sequence.CommentEnd);
			this.sectionStart = -1;
			this.state = State.Text;
		} else {
			this.sectionStart = this.index;
			this.state = State.InTagName;
		}
	}

	stateText(code) {
		if (isWhitespace(code)) return ++this.sectionStart;
		else if (code === CharCode.Lt || this.fastForwardTo(CharCode.Lt)) {
			if (this.sectionStart > 0) this.emitData("text");
			this.state = State.BeforeTagName;
			this.sectionStart = this.index;
		}
	}

	allStates = {
		[State.Text]: this.stateText,
		[State.BeforeTagName]: this.stateBeforeTagName,
		[State.InTagName]: this.stateInTagName,
		[State.BeforeAttributeName]: this.stateBeforeAttributeName,
		[State.InAttributeName]: this.stateInAttributeName,
		[State.AfterAttributeName]: this.stateAfterAttributeName,
		[State.InAttributeValueDq]: this.stateInAttributeValueDoubleQuotes,
		[State.InAttributeValueCurly]: this.stateInAttributeValueCurlyBraces,
		[State.BeforeAttributeValue]: this.stateBeforeAttributeValue,
		[State.InSelfClosingTag]: this.stateInSelfClosingTag,
		[State.InClosingTagName]: this.stateInClosingTagName,
		[State.BeforeClosingTagName]: this.stateBeforeClosingTagName,
		[State.AfterClosingTagName]: this.stateAfterClosingTagName,
	};

	/**@param {string} buffer*/
	consume(buffer, offset = 0) {
		this.buffer = buffer;
		this.size = buffer.length;
		this.offset = offset;

		while (++this.index < this.size) {
			const code = this.buffer.charCodeAt(this.index);
			this.allStates[this.state].call(this, code);
		}
		//rest after finish
		this.buffer = null;
		this.index = -1;
		this.state = State.Text;
		return true;
	}
}
