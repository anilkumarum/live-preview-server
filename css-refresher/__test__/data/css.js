export const nestedRule2 = `div {
	height: 100%;
	padding-left: 0.4em;
	color: white;

	&.success {
		background-color: limegreen;
	}
}

h2 {
	font: var(--type-heading-h2);
	margin: 4rem 0 0.5rem;

    & span {
        overflow-wrap: break-word;
    }
}
`;

export const oneRule = `div {
    height: 100%;
    padding-left: 0.4em;
    color: white;
    
}
`;

export const document = {
	getText() {
		return nestedRule2;
	},
};

export const document2 = {
	getText() {
		return oneRule;
	},
};
