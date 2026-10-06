import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyUrl } from "./classify.js";
const flags = {
  blockAdult: true,
  blockViolence: true,
  blockGambling: true,
  blockDrugs: true,
  blockHate: true,
  blockSocial: true,
  blockImageSearch: true,
  forceSafeSearch: true
};
describe("classifyUrl", () => {
  it("blocks known adult hosts", () => {
    const res = classifyUrl("https://www.pornhub.com/video", flags, [], [], {});
    assert.equal(res.allowed, false);
    assert.equal(res.category, "adult");
  });
  it("blocks adult keywords in the path", () => {
    const res = classifyUrl("https://example.com/porn", flags, [], [], {});
    assert.equal(res.allowed, false);
    assert.equal(res.category, "adult");
  });
  it("allows wikipedia", () => {
    const res = classifyUrl("https://es.wikipedia.org/wiki/Sol", flags, [], [], {});
    assert.equal(res.allowed, true);
  });
  it("rewrites YouTube to YouTube Kids", () => {
    const res = classifyUrl("https://www.youtube.com/watch?v=abc", flags, [], [], {});
    assert.equal(res.allowed, true);
    assert.equal(res.rewriteUrl, "https://www.youtubekids.com/");
  });
  it("blocks image search", () => {
    const res = classifyUrl("https://www.google.com/search?tbm=isch&q=playa", flags, [], [], {});
    assert.equal(res.allowed, false);
  });
  it("blocks social when the flag is on", () => {
    const res = classifyUrl("https://tiktok.com/@x", flags, [], [], {});
    assert.equal(res.allowed, false);
    assert.equal(res.category, "social");
  });
  it("blocks extra adult image hosts", () => {
    const res = classifyUrl("https://www.redgifs.com/watch/x", flags, [], [], {});
    assert.equal(res.allowed, false);
    assert.equal(res.category, "adult");
  });
  it("honors the parent allow list even for adult hosts", () => {
    const res = classifyUrl("https://pornhub.com", flags, [], ["pornhub.com"], {});
    assert.equal(res.allowed, true);
    assert.equal(res.category, "safe");
  });
  it("honors a custom block list", () => {
    const res = classifyUrl("https://juegos.example.com", flags, ["juegos.example.com"], [], {});
    assert.equal(res.allowed, false);
    assert.equal(res.category, "custom");
  });
  it("blocks a catalog app the parent turned off", () => {
    const res = classifyUrl("https://www.youtube.com", flags, [], [], { youtube: false });
    assert.equal(res.allowed, false);
  });
});
