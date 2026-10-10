import Realm from "realm";

afterAll(() => {
  Realm.shutdown();
});
