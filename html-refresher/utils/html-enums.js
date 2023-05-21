export const CharCode = {
	Tab: 0x9, // "\t"
	LineBreak: 0xa, // "\n" 10
	FormFeed: 0xc, // "\f"
	CarriageReturn: 0xd, // "\r"
	Space: 0x20, // " "
	ExclamationMark: 0x21, // "!"
	Number: 0x23, // "#"
	Amp: 0x26, // "&"
	SingleQuote: 0x27, // "'"
	DoubleQuote: 0x22, // '"'
	Dash: 0x2d, // "-"
	Dot: 46, // "."
	Dollar: 36,
	Slash: 0x2f, // "/"
	Zero: 0x30, // "0"
	Nine: 0x39, // "9"
	SemiColon: 0x3b, // ";"
	Lt: 0x3c, // "<"
	Eq: 0x3d, // "="
	Gt: 0x3e, // ">"
	Questionmark: 0x3f, // "?"
	UpperA: 0x41, // "A"
	LowerA: 0x61, // "a"
	UpperF: 0x46, // "F"
	LowerF: 0x66, // "f"
	UpperZ: 0x5a, // "Z"
	LowerZ: 0x7a, // "z"
	LowerX: 0x78, // "x"
	LowerS: 115, //s
	LowerC: 99, //c
	LowerL: 108, //l
	LowerT: 116, //t
	OpeningParentheses: 40, // "(",
	ClosingParentheses: 41, // ")"
	OpeningSquareBracket: 0x5b, // "["
	openingCurlyBracket: 123, // {
	closingCurlyBracket: 125, // }
};

export const State = {
	Text: "1",
	BeforeTagName: "BeforeTagName", // After <
	InTagName: "InTagName",
	InSelfClosingTag: "InSelfClosingTag",
	BeforeClosingTagName: "BeforeClosingTagName",
	InClosingTagName: "InClosingTagName",
	AfterClosingTagName: "AfterClosingTagName",

	// Attributes
	BeforeAttributeName: "BeforeAttributeName",
	InAttributeName: "InAttributeName",
	AfterAttributeName: "AfterAttributeName",
	BeforeAttributeValue: "BeforeAttributeValue",
	InAttributeValueDq: "InAttributeValueDq", // "
	InAttributeValueNq: "InAttributeValueNq",
	InAttributeValueCurly: "InAttributeValueCurly", //{

	BeforeEntity: "BeforeEntity", // &
	BeforeNumericEntity: "BeforeNumericEntity", // #
	InNamedEntity: "InNamedEntity",
	InNumericEntity: "InNumericEntity",
	InHexEntity: "InHexEntity", // X
};

export const QuoteType = {
	NoValue: 0,
	Unquoted: 1,
	Double: 3,
};

export const Sequence = {
	CmtEnd: new Uint8Array([0x2d, 0x2d, 0x3e]), // `-->`
	Doctype: new Uint8Array([
		60, 33, 68, 79, 67, 84, 89, 80, 69, 32, 104, 116, 109, 108, 62, 10, 60, 104, 116, 109, 108, 32, 108, 97,
		110, 103, 61, 34, 101, 110, 34, 62,
	]),
	ScriptTag: new Uint8Array([0x3c, 0x2f, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3e]), // `</script`
	StyleTag: new Uint8Array([0x3c, 0x2f, 0x73, 0x74, 0x79, 0x6c, 0x65, 0x3e]), // `</style`
};

// <script type="module" src="/client-hmr.js"></script>
export const clientScript = new Uint8Array([
	60, 115, 99, 114, 105, 112, 116, 32, 116, 121, 112, 101, 61, 34, 109, 111, 100, 117, 108, 101, 34, 32, 115,
	114, 99, 61, 34, 47, 99, 108, 105, 101, 110, 116, 45, 104, 109, 114, 46, 106, 115, 34, 62, 60, 47, 115, 99,
	114, 105, 112, 116, 62,
]);
