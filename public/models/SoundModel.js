class SoundModel {
    constructor() {
        const options = { probabilityThreshold: 0.85 };
        this.classifier = ml5.soundClassifier(
            "SpeechCommands18w",
            options,
            () => console.log("Sound ready")
        );
        this.label = null;

        this.classifier.classify((err, results) => {
            if (results) {
                this.label = results[0].label;
            }
        });
    }

    getAction() {
        if (this.label === "up") return "DASH";
        return null;
    }
}
