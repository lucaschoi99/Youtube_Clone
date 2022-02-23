import { async } from "regenerator-runtime";

const form = document.getElementById("commentForm");
const videoContainer = document.getElementById("videoContainer");

const addComment = (text, id) => {
    const videoComments = document.querySelector(".video__comments ul");
    const newComment = document.createElement("li");
    newComment.dataset.id = id;
    const span = document.createElement("span");
    const span2 = document.createElement("span");
    const icon = document.createElement("i");

    newComment.className = "video__comment";
    icon.className = "fas fa-comment";
    span.innerText = ` ${text}`;
    span2.innerText = " ❌";
    newComment.appendChild(icon);
    newComment.appendChild(span);
    newComment.appendChild(span2);

    videoComments.prepend(newComment);
}

const handleSubmit = async (event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const videoId = videoContainer.dataset.id;
    const text = textarea.value;

    if (text === "") {
        return;
    }

    const response = await fetch(`/api/videos/${videoId}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });

    if (response.status === 201) {
        textarea.value = "";
        const { newCommentId } = await response.json();
        addComment(text, newCommentId);
    }

}

if (form) {
    form.addEventListener("submit", handleSubmit);
}