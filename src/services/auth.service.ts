import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../utils/firebase/config";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  hd: "gmail.com", // Restrict to Gmail accounts only
});

export const authService = {
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },
};
