import React, { useEffect, useState } from "react";
import { useUserAuth } from "../context/UserAuthContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const useLoggedinuser = () => {
  const { user } = useUserAuth();
  const email = user?.email;
  const [loggedinuser, setloggedinuser] = useState({});

  useEffect(() => {
    fetch(`${API}/loggedinuser?email=${email}`)
      .then((res) => res.json())
      .then((data) => {
        // console.log(data)
        setloggedinuser(data);
      });
  }, [email, loggedinuser]);
  return [loggedinuser, setloggedinuser];
};

export default useLoggedinuser;
