function fakeApiCall() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ message: "Data fetched successfully", status: 200 });
    }, 2000);
  });
}

const getdata = async () => {
  try {
    const response = await fakeApiCall();
    console.log("Rsponse: ", response);
    return response;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

getdata();
