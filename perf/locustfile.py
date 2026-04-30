from locust import HttpUser, between, task


class SolarisApiUser(HttpUser):
    wait_time = between(0.5, 2.0)

    @task(5)
    def health(self):
        with self.client.get("/api/health", name="GET /api/health", catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"status={res.status_code}")

    @task(5)
    def status(self):
        with self.client.get("/api/status", name="GET /api/status", catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"status={res.status_code}")

