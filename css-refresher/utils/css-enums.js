export const CharCode = {
	Tab: 0x9, // "\t"
	LineBreak: 0xa, // "\n" 10
	FormFeed: 0xc, // "\f"
	CarriageReturn: 0xd, // "\r"
	Space: 0x20, // " "
	ExclamationMark: 0x21, // "!"
	Amp: 0x26, // "&"
	At: 64, //@
	SingleQuote: 0x27, // "'"
	DoubleQuote: 0x22, // '"'
	Dash: 0x2d, // "-"
	Dot: 46, // "."
	Hash: 35, //#
	Dollar: 36, //$
	Asterisk: 42, // *
	Slash: 0x2f, // /
	Zero: 0x30, // 0
	Nine: 0x39, // 9
	Colon: 58, // :
	SemiColon: 0x3b, // ;
	Gt: 0x3e, // ">"
	Eq: 0x3d, // "="
	Questionmark: 0x3f, // ?
	OpeningParentheses: 40, // "(",
	ClosingParentheses: 41, // ")"
	OpeningSquare: 0x5b, // "["
	ClosingSquare: 93, // "]"
	openingCurly: 123, // {
	closingCurly: 125, // }
	Tilde: 126, // "~"
};

export const State = {
	Text: "1",
	BeforeRuleBlock: "BeforeRuleBlock",
	InRuleBlock: "InRuleBlock",
	InAtRuleBlock: "InAtRuleBlock",
	BeforeAtRuleBlock: "BeforeAtRuleBlock",
	BeforeSelector: "BeforeSelector",
	BeforeNestedSelector: "BeforeNestedSelector",
	InSelector: "InSelector",
	InNestedSelector: "InNestedSelector",
	InDeclarationBlock: "InDeclarationBlock",
	InNestingSelector: "InSelector",
	CloseDeclarationBlock: "CloseDeclarationBlock",
};

export const selectorStarter = new Set([CharCode.Dot, CharCode.Hash, CharCode.Colon, CharCode.Asterisk]);

export const nestedSelector = new Set([...selectorStarter, CharCode.Gt, CharCode.Tilde]);

export const RuleType = {
	STYLE_RULE: 1,
	IMPORT_RULE: 3,
	MEDIA_RULE: 4,
	FONT_FACE_RULE: 5,
	PAGE_RULE: 6,
	KEYFRAMES_RULE: 7,
	KEYFRAME_RULE: 8,
	NAMESPACE_RULE: 10,
	COUNTER_STYLE_RULE: 11,
	SUPPORTS_RULE: 12,
	DOCUMENT_RULE: 13,
	FONT_FEATURE_VALUES_RULE: 14,
	VIEWPORT_RULE: 15,
	REGION_STYLE_RULE: 16,
	PROPERTY: 17,
	LAYER_RULE: 18,
	FONT_PALETTE_VALUES_RULE: 19,
	CONTAINER_RULE: 20,
	COLOR_PROFILE_RULE: 21,
	CHARSET_RULE: 27,
};

export const AtRules = {
	charset: RuleType.CHARSET_RULE,
	"color-profile": RuleType.COLOR_PROFILE_RULE,
	container: RuleType.CONTAINER_RULE,
	"counter-style": RuleType.COUNTER_STYLE_RULE,
	"font-face": RuleType.FONT_FACE_RULE,
	"font-feature-values": RuleType.FONT_FEATURE_VALUES_RULE,
	"font-palette-values": RuleType.FONT_PALETTE_VALUES_RULE,
	import: RuleType.IMPORT_RULE,
	keyframes: RuleType.KEYFRAMES_RULE,
	layer: RuleType.LAYER_RULE,
	media: RuleType.MEDIA_RULE,
	namespace: RuleType.NAMESPACE_RULE,
	page: RuleType.PAGE_RULE,
	property: RuleType.PROPERTY,
};
