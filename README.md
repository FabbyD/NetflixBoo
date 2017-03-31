Netflix Boo
------------------------------
Netflix and chill across seas.

Side project to learn web programming, user communication, backend code, chrome extensions.

## Introduction

This app follows the Model-View-Controller architecture.

**The video controller** listens and controls the video player.

**The server** is all Firebase. Makes my life easier. This is what allows two or more users to synchronize. Also takes care of user authentification.

**The controller** (aka background.js) communicates with both models and the view. Since all server communication goes through the controller, other aspects of the app can easily be modified without major refactoring.

#### Wanted
- Remove Firebase entirely and build my own server using Ruby on Rails.
- Something cool: generalized version to work with other websites (potentially any website)
