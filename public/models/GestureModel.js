class GestureModel {
    constructor() {
        this.poseNet = ml5.poseNet(this.onReady.bind(this));
        this.pose = null;
    }

    onReady() {
        console.log("PoseNet ready");
        this.poseNet.on("pose", results => {
            if (results.length > 0) {
                this.pose = results[0].pose;
            }
        });
    }

    getAction() {
        if (!this.pose) return null;

        const rightWrist = this.pose.rightWrist;
        const rightShoulder = this.pose.rightShoulder;

        if (rightWrist.y < rightShoulder.y) {
            return "ATTACK";
        }
        return null;
    }
}
