import { GAME_WIDTH, GAME_HEIGHT, CAMERA_ZOOM } from "../config.js";

/**
 * Zoomed world camera + unzoomed UI camera.
 * Splits the current display list once — never hooks add/addedtoscene (that froze boot).
 * After setup, call scene.ignoreUiCam(obj) for newly spawned world objects.
 */
export function setupZoomCameras(scene, { follow, deadzoneX = 40, deadzoneY = 28 } = {}) {
  const main = scene.cameras.main;
  main.setZoom(CAMERA_ZOOM);
  if (follow) {
    main.startFollow(follow, true, 0.14, 0.14);
    main.setDeadzone(deadzoneX, deadzoneY);
  }

  // Avoid stacking UI cameras if scene restarts
  if (scene.uiCam) {
    scene.cameras.remove(scene.uiCam);
    scene.uiCam = null;
  }

  const uiCam = scene.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
  scene.uiCam = uiCam;

  scene.ignoreUiCam = (obj) => {
    if (obj && scene.uiCam) scene.uiCam.ignore(obj);
    return obj;
  };

  const list = scene.children.list.slice();
  for (let i = 0; i < list.length; i++) {
    const child = list[i];
    if (child.getData && child.getData("isUI")) {
      main.ignore(child);
    } else {
      uiCam.ignore(child);
    }
  }

  return { main, uiCam };
}

/** Tag screen-space UI so the zoomed camera ignores it. */
export function markAsUI(gameObject) {
  gameObject.setData("isUI", true);
  return gameObject;
}
